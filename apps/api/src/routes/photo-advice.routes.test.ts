import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { PhotoAdviceResponse } from '@editorial-art/shared-types';
import type { AddressInfo } from 'node:net';
import { resetDb } from '../../test/db';
import { createApp } from '../app';
import { db } from '../lib/db';
import { resetEnvForTests } from '../lib/env';
import { closeRedis } from '../lib/redis';
import { plainReason, textForAdvice } from '../pipeline/advice';
import { setProviders } from '../providers';
import { createFakeProviders } from '../providers/fake/fake-providers';
import { closeQueues } from '../queues/queues';
import { requestsRouter } from './requests.routes';

const server = createApp({ api: [requestsRouter] }).listen(0);
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;

const HEADERS = {
  'x-api-key': 'test-key-one',
  'x-actor-user-id': '11111111-1111-4111-8111-111111111111',
  'x-actor-workspace-id': '22222222-2222-4222-8222-222222222222',
  'x-actor-role': 'member',
  'content-type': 'application/json',
};

const ANALYSIS = 'Why India’s household savings are shifting from bank deposits to mutual funds, and what it means for the economy over the next decade. '.repeat(4);

let fake = createFakeProviders();

beforeEach(async () => {
  await resetDb();
  fake = createFakeProviders();
  setProviders(fake);
});

afterAll(async () => {
  delete process.env.EA_DAILY_SPEND_CAP_INR;
  resetEnvForTests();
  server.close();
  await closeQueues();
  await closeRedis();
  await db.$disconnect();
});

async function advise(body: unknown, headers: Record<string, string> = HEADERS) {
  const res = await fetch(`${base}/requests/photo-advice`, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> & { error?: { code: string } } };
}

describe('POST /requests/photo-advice', () => {
  test('needs the internal key like every other request route', async () => {
    const { 'x-api-key': _key, ...noKey } = HEADERS;
    expect((await advise({ text: ANALYSIS }, noKey)).status).toBe(401);
  });

  test('validates the body: text is required, unknown fields are refused', async () => {
    expect((await advise({ title: 'Only a title' })).body.error?.code).toBe('VALIDATION_ERROR');
    expect((await advise({ text: '' })).status).toBe(400);
    expect((await advise({ text: ANALYSIS, styleId: 'x' })).status).toBe(400);
    expect(fake.calls).toHaveLength(0);
  });

  test('an analysis piece gets no suggestion', async () => {
    const { status, body } = await advise({ title: 'Where savings go', text: ANALYSIS });
    expect(status).toBe(200);
    expect(PhotoAdviceResponse.parse(body)).toMatchObject({ suggestPhoto: false, kind: 'none' });
    expect(fake.calls).toEqual([{ kind: 'chat:photo_advice', model: 'gpt-4.1-mini' }]);
    const [attempt] = await db.attempt.findMany();
    expect(attempt).toMatchObject({ stage: 'photo_advice', result: 'OK', requestId: null });
    expect(await db.request.count()).toBe(0);
  });

  test('a named-person story suggests a real photo with a short plain reason', async () => {
    const { status, body } = await advise({ title: 'CEO on Q2 results', text: `FAKE_PHOTO ${ANALYSIS}` });
    expect(status).toBe(200);
    const advice = PhotoAdviceResponse.parse(body);
    expect(advice).toMatchObject({ suggestPhoto: true, kind: 'real-person' });
    expect(advice.reason.length).toBeGreaterThan(0);
    expect(advice.reason.length).toBeLessThanOrEqual(160);
  });

  test('fail mode: a model failure answers "no suggestion" with a 200, and is still recorded', async () => {
    const { status, body } = await advise({ text: `FAKE_ADVICE_FAIL ${ANALYSIS}` });
    expect(status).toBe(200);
    expect(body).toEqual({ suggestPhoto: false, reason: '', kind: 'none' });
    const [attempt] = await db.attempt.findMany();
    expect(attempt).toMatchObject({ stage: 'photo_advice', result: 'ERROR' });
  });

  test('fail mode: a timeout or an answer in the wrong shape also answers "no suggestion"', async () => {
    expect((await advise({ text: `FAKE_TIMEOUT ${ANALYSIS}` })).body).toEqual({ suggestPhoto: false, reason: '', kind: 'none' });
    expect((await advise({ text: `FAKE_BAD_JSON ${ANALYSIS}` })).body).toEqual({ suggestPhoto: false, reason: '', kind: 'none' });
  });

  test('the spend guard stops the call before it is made', async () => {
    process.env.EA_DAILY_SPEND_CAP_INR = '0.01';
    resetEnvForTests();
    const { status, body } = await advise({ text: `FAKE_PHOTO ${ANALYSIS}` });
    expect(status).toBe(200);
    expect(body.suggestPhoto).toBe(false);
    expect(fake.calls).toHaveLength(0);
    delete process.env.EA_DAILY_SPEND_CAP_INR;
    resetEnvForTests();
  });
});

describe('photo advice helpers', () => {
  test('long articles keep the opening, cut at a word', () => {
    const long = 'word '.repeat(2_000);
    const cut = textForAdvice(long);
    expect(cut.truncated).toBe(true);
    expect(cut.text.length).toBeLessThanOrEqual(4_000);
    expect(cut.text.endsWith('word')).toBe(true);
    expect(textForAdvice('short')).toEqual({ text: 'short', truncated: false });
  });

  test('the reason is one plain line of at most 160 characters', () => {
    expect(plainReason('  A **named**\n"CEO"  leads <b>this</b>. ')).toBe('A named CEO leads this.');
    const long = plainReason('photo '.repeat(60));
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long.endsWith('...')).toBe(true);
  });
});
