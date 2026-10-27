import { afterAll, beforeAll, describe, expect, spyOn, test } from 'bun:test';
import { BatchPlan, OptionDto, RequestDetail } from '@editorial-art/shared-types';
import type { AddressInfo } from 'node:net';
import { resetDb } from '../../test/db';
import { artistReferences, liveLibrary, ARTICLE } from '../../test/harness';
import { createApp } from '../app';
import { db } from '../lib/db';
import { logger } from '../lib/logger';
import { closeRedis } from '../lib/redis';
import { runRead } from '../pipeline/read';
import { setProviders } from '../providers';
import { createFakeProviders } from '../providers/fake/fake-providers';
import { closeQueues } from '../queues/queues';
import { optionsRouter } from './options.routes';
import { requestsRouter } from './requests.routes';

/**
 * Showing and choosing the references sent to the image model. No workers run: the read is run
 * in-process, and the batch's options are checked as planned, before any preview is made.
 */

const server = createApp({ api: [requestsRouter, optionsRouter] }).listen(0);
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;

const HEADERS = {
  'x-api-key': 'test-key-one',
  'x-actor-user-id': '11111111-1111-4111-8111-111111111111',
  'x-actor-workspace-id': '22222222-2222-4222-8222-222222222222',
  'x-actor-role': 'member',
  'content-type': 'application/json',
};

let watercolour = '';
let inkWash = '';
let refs: { id: string; artistId: string }[] = [];
const artistOf = (id: string) => refs.find((r) => r.id === id)?.artistId;
let day = 0;

async function call(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${base}${path}`, { method, headers: HEADERS, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: res.status, json: (await res.json()) as Record<string, unknown> & { error?: { code: string; message: string } } };
}

/** Creates a request, reads it in-process (which plans the first batch) and returns its public id. */
async function request(body: Record<string, unknown>): Promise<string> {
  const res = await call('/requests', 'POST', { articleText: ARTICLE.replace('Monday', `day ${++day}`), ...body });
  expect(res.status).toBe(202);
  const row = await db.request.findUniqueOrThrow({ where: { publicId: res.json.requestId as string } });
  await runRead(row.id);
  return row.publicId;
}

async function batch(publicId: string, seq: number) {
  const row = await db.request.findUniqueOrThrow({ where: { publicId } });
  return db.batch.findFirstOrThrow({ where: { requestId: row.id, seq }, include: { options: { orderBy: { index: 'asc' } } } });
}

/** No previews are made here, so a batch is marked done by hand before the next one. */
async function settle(publicId: string, seq: number) {
  await db.batch.update({ where: { id: (await batch(publicId, seq)).id }, data: { status: 'READY' } });
}

beforeAll(async () => {
  await resetDb();
  setProviders(createFakeProviders());
  const ids = await liveLibrary(['watercolour', 'ink-wash'], 4);
  watercolour = ids.get('watercolour')!;
  inkWash = ids.get('ink-wash')!;
  await db.styleReference.updateMany({ where: { styleId: watercolour, source: 'GENERATED' }, data: { status: 'RETIRED' } });
  refs = await artistReferences(watercolour, 5, 4);
});

afterAll(async () => {
  server.close();
  await closeQueues();
  await closeRedis();
  await db.$disconnect();
});

describe('choosing the references sent to the image model', () => {
  test('without a choice, each option still takes three references by one artist, four artists in all', async () => {
    const id = await request({ styleId: watercolour });
    const b = await batch(id, 1);
    expect(b.options).toHaveLength(4);
    const artists = b.options.map((o) => {
      expect(o.referenceIds).toHaveLength(3);
      expect(new Set(o.referenceIds.map(artistOf)).size).toBe(1);
      return artistOf(o.referenceIds[0]!);
    });
    expect(new Set(artists).size).toBe(4);
    expect(BatchPlan.parse(b.directionPlan).chosenReferenceIds).toBeNull();
  });

  test('chosen references go into all four options, in order, are kept on the request, and a "More" batch keeps them', async () => {
    const info = spyOn(logger, 'info');
    const chosen = [refs[5]!.id, refs[0]!.id, refs[17]!.id];
    const id = await request({ styleId: watercolour, referenceIds: chosen });
    // Three different artists: allowed, and logged.
    expect(info.mock.calls.some((c) => c[1] === 'mixed_artists')).toBe(true);
    info.mockRestore();

    const row = await db.request.findUniqueOrThrow({ where: { publicId: id } });
    expect(row.referenceIds).toEqual(chosen);
    const first = await batch(id, 1);
    expect(first.options.every((o) => JSON.stringify(o.referenceIds) === JSON.stringify(chosen))).toBe(true);
    expect(BatchPlan.parse(first.directionPlan).chosenReferenceIds).toEqual(chosen);

    await settle(id, 1);
    expect((await call(`/requests/${id}/batches`, 'POST', { kind: 'MORE' })).status).toBe(202);
    expect((await batch(id, 2)).options.every((o) => JSON.stringify(o.referenceIds) === JSON.stringify(chosen))).toBe(true);

    await settle(id, 2);
    const again = [refs[9]!.id];
    expect((await call(`/requests/${id}/batches`, 'POST', { kind: 'ANOTHER_STYLE', styleId: watercolour, referenceIds: again })).status).toBe(202);
    const third = await batch(id, 3);
    expect(third.options).toHaveLength(4);
    expect(third.options.every((o) => JSON.stringify(o.referenceIds) === JSON.stringify(again))).toBe(true);
  });

  test('option responses list the references sent, in order, with their artist', async () => {
    const chosen = [refs[6]!.id, refs[4]!.id];
    const id = await request({ styleId: watercolour, referenceIds: chosen });
    const detail = await call(`/requests/${id}`);
    expect(detail.status).toBe(200);
    const options = RequestDetail.parse(detail.json).batches[0]!.options;
    for (const o of options) {
      expect(o.references.map((r) => r.id)).toEqual(chosen);
      expect(o.references[0]).toEqual({ id: chosen[0]!, url: expect.stringContaining('artist-1'), artist: { name: 'Test Artist 1', url: 'https://example.com/artist-1' } });
    }
    const one = OptionDto.parse((await call(`/options/${options[0]!.id}`)).json);
    expect(one.references.map((r) => r.id)).toEqual(chosen);

    // References without an artist come back with artist null; automatic picks are listed too.
    const legacy = await request({ styleId: inkWash });
    const auto = RequestDetail.parse((await call(`/requests/${legacy}`)).json).batches[0]!.options;
    for (const o of auto) {
      expect(o.references).toHaveLength(3);
      expect(o.references.every((r) => r.artist === null)).toBe(true);
    }
  });

  test('a reference from another style, or not approved, is refused', async () => {
    const foreign = await db.styleReference.findFirstOrThrow({ where: { styleId: inkWash, status: 'APPROVED' } });
    const retired = await db.styleReference.findFirstOrThrow({ where: { styleId: watercolour, status: 'RETIRED' } });
    for (const bad of [[refs[0]!.id, foreign.id], [retired.id]]) {
      const res = await call('/requests', 'POST', { articleText: ARTICLE, styleId: watercolour, referenceIds: bad });
      expect(res.status).toBe(400);
      expect(res.json.error?.message).toBe("These references don't belong to this style.");
    }

    const id = await request({ styleId: watercolour });
    await settle(id, 1);
    const res = await call(`/requests/${id}/batches`, 'POST', { kind: 'ANOTHER_STYLE', styleId: watercolour, referenceIds: [foreign.id] });
    expect(res.status).toBe(400);
    expect(res.json.error?.message).toBe("These references don't belong to this style.");
  });

  test('referenceIds with pinnedReferenceId, without a style, repeated or more than three is refused', async () => {
    const both = { styleId: watercolour, referenceIds: [refs[0]!.id], pinnedReferenceId: refs[1]!.id };
    const create = await call('/requests', 'POST', { articleText: ARTICLE, ...both });
    expect(create.status).toBe(400);
    expect(create.json.error?.message).toContain('not both');

    const id = await request({ styleId: watercolour });
    await settle(id, 1);
    const another = await call(`/requests/${id}/batches`, 'POST', { kind: 'ANOTHER_STYLE', ...both });
    expect(another.status).toBe(400);
    expect(another.json.error?.message).toContain('not both');

    expect((await call('/requests', 'POST', { articleText: ARTICLE, referenceIds: [refs[0]!.id] })).json.error?.message).toContain('styleId');
    expect((await call('/requests', 'POST', { articleText: ARTICLE, styleId: watercolour, referenceIds: [refs[0]!.id, refs[0]!.id] })).status).toBe(400);
    expect((await call('/requests', 'POST', { articleText: ARTICLE, styleId: watercolour, referenceIds: refs.slice(0, 4).map((r) => r.id) })).status).toBe(400);
    expect((await call('/requests', 'POST', { articleText: ARTICLE, styleId: watercolour, referenceIds: [] })).status).toBe(400);
  });
});
