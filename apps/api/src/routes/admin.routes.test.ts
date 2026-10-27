import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import type { AddressInfo } from 'node:net';
import sharp from 'sharp';
import { ImageModelSettingResponse } from '@editorial-art/shared-types';
import { resetDb } from '../../test/db';
import { createApp } from '../app';
import { db } from '../lib/db';
import { closeRedis, redis } from '../lib/redis';
import { env } from '../lib/env';
import { resetSettingsCacheForTests } from '../lib/settings';
import { NEUTRAL_SUBJECTS } from '../library/exemplars';
import { seedStyles } from '../library/styles';
import { setProviders } from '../providers';
import { createFakeProviders } from '../providers/fake/fake-providers';
import { closeQueues, queue, type LibraryJob } from '../queues/queues';
import { processLibraryJob } from '../workers/library.worker';
import { adminRouter } from './admin.routes';

const server = createApp({ api: [adminRouter] }).listen(0);
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;

const ADMIN = '11111111-1111-4111-8111-111111111111';
const MEMBER = '33333333-3333-4333-8333-333333333333';
const WORKSPACE = '22222222-2222-4222-8222-222222222222';

function headers(role: 'admin' | 'member', json = true): Record<string, string> {
  return {
    'x-api-key': 'test-key-one',
    'x-actor-user-id': role === 'admin' ? ADMIN : MEMBER,
    'x-actor-workspace-id': WORKSPACE,
    'x-actor-role': role,
    ...(json ? { 'content-type': 'application/json' } : {}),
  };
}

async function call(path: string, init: { method?: string; body?: unknown; role?: 'admin' | 'member' } = {}) {
  const res = await fetch(`${base}${path}`, {
    method: init.method ?? 'GET',
    headers: headers(init.role ?? 'admin'),
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> & { error?: { code: string } } };
}

async function styleId(slug: string): Promise<string> {
  return (await db.style.findUniqueOrThrow({ where: { slug }, select: { id: true } })).id;
}

async function processQueuedLibraryJobs(): Promise<number> {
  const jobs = await queue('library').getJobs(['waiting', 'prioritized', 'delayed']);
  for (const job of jobs) {
    await processLibraryJob(job.data as LibraryJob);
    await job.remove();
  }
  return jobs.length;
}

/** Adds approved references to a style directly, to reach the publish threshold quickly. */
async function addApproved(id: string, count: number): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const ref = await db.styleReference.create({
      data: {
        styleId: id,
        source: 'GENERATED',
        sourceNote: 'test',
        url: `https://res.cloudinary.com/fake/image/upload/v1/t/${i}.webp`,
        publicId: `t/${i}`,
        width: 1600,
        height: 900,
        description: 'A test reference image with a single subject on a calm background.',
        subjects: ['object'],
        mood: 'calm',
        status: 'APPROVED',
      },
    });
    ids.push(ref.id);
  }
  return ids;
}

async function png(width = 320, height = 180): Promise<Blob> {
  const buffer = await sharp({ create: { width, height, channels: 3, background: '#3a6ea5' } }).png().toBuffer();
  return new Blob([new Uint8Array(buffer)], { type: 'image/png' });
}

beforeEach(async () => {
  await resetDb();
  await seedStyles();
  setProviders(createFakeProviders());
  await queue('library').obliterate({ force: true });
  const keys = await redis().keys(`${env().EA_QUEUE_PREFIX}:rl:*`);
  if (keys.length) await redis().del(...keys);
});

afterAll(async () => {
  server.close();
  setProviders(undefined);
  await queue('library').obliterate({ force: true });
  await closeQueues();
  await closeRedis();
  await db.$disconnect();
});

describe('admin access', () => {
  test('members are refused', async () => {
    const res = await call('/admin/styles', { role: 'member' });
    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe('FORBIDDEN');
  });

  test('the styles list has all 33 with counts', async () => {
    const res = await call('/admin/styles');
    const styles = res.body.styles as { slug: string; status: string; counts: { approved: number } }[];
    expect(styles).toHaveLength(33);
    expect(styles[0]).toMatchObject({ status: 'DRAFT', counts: { approved: 0 } });
  });
});

describe('generating, reviewing and publishing a style', () => {
  test('generate queues one job per subject, moves the style to curating, and the jobs make screened candidates', async () => {
    const id = await styleId('ink-wash');
    const res = await call(`/admin/styles/${id}/generate`, { method: 'POST', body: { subjects: NEUTRAL_SUBJECTS.slice(0, 3), useApprovedAsRefs: false } });
    expect(res.status).toBe(202);
    expect(res.body.queued).toBe(3);
    expect(res.body.estimatedCostInr as number).toBeGreaterThan(0);
    expect((await db.style.findUniqueOrThrow({ where: { id } })).status).toBe('CURATING');

    expect(await processQueuedLibraryJobs()).toBe(3);
    const list = await call(`/admin/references?styleId=${id}&limit=200`);
    expect(list.status).toBe(200);
    const items = list.body.items as { status: string; screen: { passed: boolean } | null; description: string }[];
    expect(items).toHaveLength(3);
    expect(items.every((r) => r.status === 'CANDIDATE' && r.screen?.passed && r.description.length > 0)).toBe(true);

    // Asking again only pays for what is missing.
    await call(`/admin/styles/${id}/generate`, { method: 'POST', body: { subjects: NEUTRAL_SUBJECTS.slice(0, 3), useApprovedAsRefs: false } });
    await processQueuedLibraryJobs();
    expect(await db.styleReference.count({ where: { styleId: id } })).toBe(3);
  });

  test('publish is refused at 14 approved and allowed at 15, picking covers', async () => {
    const id = await styleId('charcoal');
    const refs = await addApproved(id, 14);
    const refused = await call(`/admin/styles/${id}/publish`, { method: 'POST' });
    expect(refused.status).toBe(409);
    expect(refused.body.error?.code).toBe('STYLE_NOT_READY');

    await addApproved(id, 1);
    const published = await call(`/admin/styles/${id}/publish`, { method: 'POST' });
    expect(published.status).toBe(200);
    expect(published.body.status).toBe('LIVE');
    expect(published.body.coverReferenceIds as string[]).toHaveLength(3);

    // Rejecting a cover takes it off the style's covers.
    const cover = (published.body.coverReferenceIds as string[])[0]!;
    expect(refs).toContain(cover);
    await call(`/admin/references/${cover}/review`, { method: 'POST', body: { decision: 'REJECTED', reasonChip: 'quality' } });
    expect((await db.style.findUniqueOrThrow({ where: { id } })).coverReferenceIds).not.toContain(cover);
  });

  test('review and bulk review record the reviewer', async () => {
    const id = await styleId('watercolour');
    const [a, b, c] = await addApproved(id, 3);
    await db.styleReference.updateMany({ where: { id: { in: [a!, b!, c!] } }, data: { status: 'CANDIDATE' } });

    const one = await call(`/admin/references/${a}/review`, { method: 'POST', body: { decision: 'APPROVED' } });
    expect(one.status).toBe(200);
    expect(one.body.status).toBe('APPROVED');
    expect((await db.styleReference.findUniqueOrThrow({ where: { id: a! } })).reviewedBy).toBe(ADMIN);

    const bulk = await call('/admin/references/bulk-review', { method: 'POST', body: { ids: [b, c], decision: 'REJECTED', note: 'off-style' } });
    expect(bulk.body.updated).toBe(2);
    expect(await db.auditEvent.count({ where: { action: 'reference.review' } })).toBe(2);
  });

  test('unknown ids are 404 and bad bodies are validation errors', async () => {
    expect((await call('/admin/styles/00000000-0000-4000-8000-000000000000/publish', { method: 'POST' })).status).toBe(404);
    expect((await call('/admin/styles/not-a-uuid/retire', { method: 'POST' })).status).toBe(404);
    const bad = await call(`/admin/styles/${await styleId('ink-wash')}/generate`, { method: 'POST', body: { useApprovedAsRefs: 'yes' } });
    expect(bad.body.error?.code).toBe('VALIDATION_ERROR');
  });

  test('retire stops offering a style', async () => {
    const id = await styleId('riso-screen');
    const res = await call(`/admin/styles/${id}/retire`, { method: 'POST' });
    expect(res.body.status).toBe('RETIRED');
  });

  test('patch validates the rule sheet and audits the change', async () => {
    const id = await styleId('ink-wash');
    const ok = await call(`/admin/styles/${id}`, { method: 'PATCH', body: { summary: 'Loose ink line with a single warm accent' } });
    expect(ok.body.summary).toBe('Loose ink line with a single warm accent');
    const bad = await call(`/admin/styles/${id}`, { method: 'PATCH', body: { safety: { allowsPeople: false, allowsRealPeople: true, allowsSensitive: true, photoreal: false } } });
    expect(bad.status).toBe(400);
    expect(await db.auditEvent.count({ where: { action: 'style.update' } })).toBe(1);
  });
});

describe('uploads', () => {
  test('an ET archive image is stored, queued for description, and described', async () => {
    const id = await styleId('mixed-media');
    const form = new FormData();
    form.append('styleId', id);
    form.append('source', 'ET_ARCHIVE');
    form.append('sourceNote', 'ET archive illustration, rights held by ET');
    form.append('image', await png(), 'art.png');
    const res = await fetch(`${base}/admin/references/upload`, { method: 'POST', headers: headers('admin', false), body: form });
    const body = (await res.json()) as { id: string; source: string; status: string };
    expect(res.status).toBe(201);
    expect(body).toMatchObject({ source: 'ET_ARCHIVE', status: 'CANDIDATE' });
    expect(await processQueuedLibraryJobs()).toBe(1);
    expect((await db.styleReference.findUniqueOrThrow({ where: { id: body.id } })).description.length).toBeGreaterThan(40);
  });

  test('a file that is not an image is refused, whatever its name says', async () => {
    const form = new FormData();
    form.append('styleId', await styleId('mixed-media'));
    form.append('source', 'LICENSED');
    form.append('sourceNote', 'Licence 123');
    form.append('image', new Blob(['<html>not an image</html>'], { type: 'image/png' }), 'fake.png');
    const res = await fetch(`${base}/admin/references/upload`, { method: 'POST', headers: headers('admin', false), body: form });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('UPLOAD_INVALID');
  });

  test('a likeness is created with its photos and aliases, then retired', async () => {
    const form = new FormData();
    form.append('name', 'Asha Rao');
    form.append('aliases', JSON.stringify(['A. Rao', 'Asha']));
    form.append('consentNote', 'Official press photos, approved by the desk head.');
    form.append('photos', await png(), 'one.png');
    form.append('photos', await png(400, 400), 'two.png');
    const res = await fetch(`${base}/admin/likenesses`, { method: 'POST', headers: headers('admin', false), body: form });
    const body = (await res.json()) as { id: string; aliases: string[]; photos: unknown[]; status: string };
    expect(res.status).toBe(201);
    expect(body.aliases).toEqual(['A. Rao', 'Asha']);
    expect(body.photos).toHaveLength(2);

    const list = await call('/admin/likenesses');
    expect(list.body.items as unknown[]).toHaveLength(1);

    const retired = await call(`/admin/likenesses/${body.id}`, { method: 'PATCH', body: { status: 'RETIRED' } });
    expect(retired.body).toMatchObject({ status: 'RETIRED', photos: [] });
  });

  test('a likeness needs at least one photo', async () => {
    const form = new FormData();
    form.append('name', 'No Photo');
    form.append('consentNote', 'Approved by the desk head.');
    const res = await fetch(`${base}/admin/likenesses`, { method: 'POST', headers: headers('admin', false), body: form });
    expect(res.status).toBe(400);
  });
});

describe('spend', () => {
  test('reports today, the month and the caps', async () => {
    const res = await call('/admin/spend');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ todayInr: 0, dailyCapInr: null, monthInr: 0 });
  });
});

describe('image model setting', () => {
  beforeEach(() => resetSettingsCacheForTests());

  test('GET shows the env defaults and every model admins can pick', async () => {
    const res = await call('/admin/settings/image-models');
    expect(res.status).toBe(200);
    expect(ImageModelSettingResponse.parse(res.body)).toEqual({
      previewModel: 'gemini-3.1-flash-image',
      finalModel: 'gemini-3-pro-image',
      finalImageSize: '2K',
      options: [
        { id: 'gemini-3.1-flash-image', label: 'Gemini 3.1 Flash Image', provider: 'gemini', speed: 'fast', note: expect.any(String) },
        { id: 'gemini-3-pro-image', label: 'Gemini 3 Pro Image', provider: 'gemini', speed: 'standard', note: expect.any(String) },
        { id: 'gpt-image-2', label: 'GPT Image 2', provider: 'openai', speed: 'standard', note: expect.any(String) },
      ],
    });
  });

  test('PUT changes one or both models, persists, and is audited', async () => {
    const put = await call('/admin/settings/image-models', { method: 'PUT', body: { previewModel: 'gpt-image-2' } });
    expect(put.status).toBe(200);
    expect(put.body).toMatchObject({ previewModel: 'gpt-image-2', finalModel: 'gemini-3-pro-image', finalImageSize: '2K' });
    expect((await call('/admin/settings/image-models', { method: 'PUT', body: { finalImageSize: '4K' } })).body).toMatchObject({ previewModel: 'gpt-image-2', finalImageSize: '4K' });
    resetSettingsCacheForTests();
    expect((await call('/admin/settings/image-models')).body).toMatchObject({ previewModel: 'gpt-image-2', finalModel: 'gemini-3-pro-image', finalImageSize: '4K' });
    const audit = await db.auditEvent.findFirstOrThrow({ where: { action: 'setting.image_models' } });
    expect(audit.metadata).toMatchObject({ before: { previewModel: 'gemini-3.1-flash-image' }, after: { previewModel: 'gpt-image-2' } });
  });

  test('PUT refuses an unknown model, an empty body, extra fields and members', async () => {
    for (const body of [{ previewModel: 'dall-e-3' }, {}, { previewModel: 'gpt-image-2', provider: 'openai' }, { finalModel: 42 }, { finalImageSize: '1K' }, { finalImageSize: '8K' }]) {
      const res = await call('/admin/settings/image-models', { method: 'PUT', body });
      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('VALIDATION_ERROR');
    }
    expect((await call('/admin/settings/image-models', { method: 'PUT', body: { previewModel: 'gpt-image-2' }, role: 'member' })).status).toBe(403);
    expect((await call('/admin/settings/image-models', { role: 'member' })).status).toBe(403);
    expect(await db.setting.count()).toBe(0);
  });

  test('what an option sent is admin only, and an unknown option is a 404', async () => {
    const id = '99999999-9999-4999-8999-999999999999';
    expect((await call(`/admin/options/${id}/inputs`, { role: 'member' })).status).toBe(403);
    expect((await call(`/admin/options/${id}/inputs`)).status).toBe(404);
  });
});
