import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { AddressInfo } from 'node:net';
import { AdminStatsResponse } from '@editorial-art/shared-types';
import { resetDb } from '../../test/db';
import { createApp } from '../app';
import { db } from '../lib/db';
import { closeRedis } from '../lib/redis';
import { seedStyles } from '../library/styles';
import { NO_TEXT_AGAIN } from '../pipeline/preview';
import { closeQueues } from '../queues/queues';
import { adminRouter } from './admin.routes';
import { istDay } from './admin-stats';

const server = createApp({ api: [adminRouter] }).listen(0);
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;

const ADMIN = '11111111-1111-4111-8111-111111111111';
const U1 = '55555555-5555-4555-8555-555555555555';
const U2 = '66666666-6666-4666-8666-666666666666';
const WORKSPACE = '22222222-2222-4222-8222-222222222222';

async function get(path: string, opts: { role?: 'admin' | 'member'; key?: string | null } = {}) {
  const headers: Record<string, string> = {
    'x-actor-user-id': ADMIN,
    'x-actor-workspace-id': WORKSPACE,
    'x-actor-role': opts.role ?? 'admin',
  };
  if (opts.key !== null) headers['x-api-key'] = opts.key ?? 'test-key-one';
  const res = await fetch(`${base}${path}`, { headers });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> & { error?: { code: string } } };
}

const at = (iso: string) => new Date(iso);
const RANGE = '?from=2026-03-01T00:00:00.000Z&to=2026-03-03T00:00:00.000Z';
let styleA: string;
let styleB: string;
let liveStyles: number;

async function request(n: number, actorUserId: string, createdAt: string) {
  return db.request.create({
    data: {
      publicId: `ear_${'A'.repeat(21)}${n}`,
      callerKeyId: 'test',
      actorUserId,
      actorWorkspaceId: WORKSPACE,
      articleHash: `hash-${n}`,
      articleChars: 500,
      articleExcerpt: 'excerpt',
      spendCapInr: 100,
      createdAt: at(createdAt),
      expiresAt: at('2027-01-01T00:00:00Z'),
    },
  });
}

async function batch(requestId: string, createdAt: string) {
  return db.batch.create({ data: { requestId, seq: 1, kind: 'INITIAL', directionPlan: {}, requestedBy: ADMIN, createdAt: at(createdAt) } });
}

type OptionData = Partial<Parameters<typeof db.option.create>[0]['data']>;
async function option(b: { id: string; requestId: string; createdAt: Date }, index: number, styleId: string, data: OptionData) {
  return db.option.create({
    data: { batchId: b.id, requestId: b.requestId, index, directionId: 'd', styleId, referenceIds: [], likenessIds: [], createdAt: b.createdAt, ...data } as Parameters<typeof db.option.create>[0]['data'],
  });
}

async function attempt(a: { requestId?: string | null; optionId?: string | null; stage: string; provider: string; model: string; result?: 'OK' | 'REFUSED' | 'ERROR' | 'TIMEOUT'; costInr: number; startedAt: string; latencyMs: number }) {
  const startedAt = at(a.startedAt);
  return db.attempt.create({
    data: {
      requestId: a.requestId ?? null,
      optionId: a.optionId ?? null,
      stage: a.stage,
      provider: a.provider,
      model: a.model,
      result: a.result ?? 'OK',
      costInr: a.costInr,
      latencyMs: a.latencyMs,
      startedAt,
      completedAt: new Date(startedAt.getTime() + a.latencyMs),
    },
  });
}

const judge = (onStyle: number, appeal: number, composition: number) => ({
  hasText: false,
  hasLogoOrWatermark: false,
  anatomyOk: true,
  matchesPreview: true,
  onStyle,
  appeal,
  ideaClarity: 3,
  composition,
  photorealNewsRisk: false,
  realPersonLikenessRisk: false,
  notes: 'ok',
});
const sent = (prompt: string) => ({ model: 'gemini-3.1-flash-image', prompt, images: [] });

beforeAll(async () => {
  await resetDb();
  await seedStyles();
  const styles = await db.style.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true } });
  [styleA, styleB] = [styles[0]!.id, styles[1]!.id];
  await db.style.update({ where: { id: styles[2]!.id }, data: { status: 'RETIRED', retiredAt: new Date() } });
  liveStyles = styles.length - 1;

  const flash = { provider: 'google', model: 'gemini-3.1-flash-image' };
  const gpt41 = { provider: 'openai', model: 'gpt-4.1' };

  // R1: 10:30 IST on 1 March. B1 has four options: a final, a preview, a blocked one and a failed final.
  const r1 = await request(1, U1, '2026-03-01T05:00:00Z');
  const b1 = await batch(r1.id, '2026-03-01T05:00:10Z');
  const o1 = await option(b1, 0, styleA, {
    state: 'PACK_READY',
    previewUrl: 'https://x/p1',
    previewModel: 'gemini-3.1-flash-image',
    previewInput: sent(`draw it\n\n${NO_TEXT_AGAIN}`),
    picked: true,
    pickedAt: at('2026-03-01T05:02:00Z'),
    finalUrl: 'https://x/f1',
    finalModel: 'gemini-3-pro-image',
    judge: judge(4, 4, 5),
  });
  const o2 = await option(b1, 1, styleA, { state: 'PREVIEW_READY', previewUrl: 'https://x/p2', previewModel: 'gemini-3.1-flash-image', previewInput: sent('draw it') });
  const o3 = await option(b1, 2, styleB, { state: 'BLOCKED', previewInput: sent('draw it') });
  const o4 = await option(b1, 3, styleB, {
    state: 'FINAL_FAILED',
    previewUrl: 'https://x/p4',
    previewModel: 'gpt-image-2',
    previewInput: sent('draw it'),
    picked: true,
    pickedAt: at('2026-03-01T05:03:00Z'),
    judge: judge(2, 3, 3),
  });
  await attempt({ requestId: r1.id, stage: 'read', ...gpt41, costInr: 0.5, startedAt: '2026-03-01T05:00:01Z', latencyMs: 1000 });
  // O1 is ready when its preview check completes, 05:00:30: 20 s after the batch. O2 is later.
  await attempt({ requestId: r1.id, optionId: o1.id, stage: 'preview', ...flash, costInr: 3, startedAt: '2026-03-01T05:00:15Z', latencyMs: 10_000 });
  await attempt({ requestId: r1.id, optionId: o1.id, stage: 'preview_check', ...gpt41, costInr: 0.1, startedAt: '2026-03-01T05:00:25Z', latencyMs: 5000 });
  await attempt({ requestId: r1.id, optionId: o2.id, stage: 'preview', ...flash, costInr: 3, startedAt: '2026-03-01T05:00:15Z', latencyMs: 20_000 });
  await attempt({ requestId: r1.id, optionId: o3.id, stage: 'preview', ...flash, result: 'REFUSED', costInr: 0, startedAt: '2026-03-01T05:00:15Z', latencyMs: 2000 });
  await attempt({ requestId: r1.id, optionId: o3.id, stage: 'preview', ...flash, result: 'REFUSED', costInr: 0, startedAt: '2026-03-01T05:00:18Z', latencyMs: 4000 });
  await attempt({ requestId: r1.id, optionId: o4.id, stage: 'preview', provider: 'openai', model: 'gpt-image-2', costInr: 4, startedAt: '2026-03-01T05:00:15Z', latencyMs: 30_000 });
  // O1's final: picked 05:02:00, judged by 05:02:44 (44 s). The pack call after it does not count.
  await attempt({ requestId: r1.id, optionId: o1.id, stage: 'finalize', provider: 'google', model: 'gemini-3-pro-image', costInr: 10, startedAt: '2026-03-01T05:02:01Z', latencyMs: 40_000 });
  await attempt({ requestId: r1.id, optionId: o1.id, stage: 'judge', ...gpt41, costInr: 0.2, startedAt: '2026-03-01T05:02:41Z', latencyMs: 3000 });
  await attempt({ requestId: r1.id, optionId: o1.id, stage: 'pack_text', ...gpt41, costInr: 0.1, startedAt: '2026-03-01T05:02:48Z', latencyMs: 2000 });

  // R2: 01:30 IST on 2 March (still 1 March in UTC). Its only option failed.
  const r2 = await request(2, U2, '2026-03-01T20:00:00Z');
  const b2 = await batch(r2.id, '2026-03-01T20:00:10Z');
  const o5 = await option(b2, 0, styleB, { state: 'PREVIEW_FAILED', previewInput: sent('draw it') });
  await attempt({ requestId: r2.id, optionId: o5.id, stage: 'preview', ...flash, result: 'ERROR', costInr: 0, startedAt: '2026-03-01T20:00:15Z', latencyMs: 60_000 });

  // Library work in the range: in the totals, in no user's or style's cost.
  await attempt({ stage: 'exemplar', provider: 'openai', model: 'gpt-image-2', costInr: 5, startedAt: '2026-03-02T10:00:00Z', latencyMs: 50_000 });

  // Before the range: never counted.
  const r3 = await request(3, U1, '2026-02-20T05:00:00Z');
  await attempt({ requestId: r3.id, stage: 'read', ...gpt41, costInr: 99, startedAt: '2026-02-20T05:00:01Z', latencyMs: 1000 });
});

afterAll(async () => {
  server.close();
  await closeQueues();
  await closeRedis();
  await db.$disconnect();
});

describe('GET /admin/stats', () => {
  test('needs the API key (401) and the admin role (403)', async () => {
    expect((await get(`/admin/stats${RANGE}`, { key: null })).status).toBe(401);
    expect((await get(`/admin/stats${RANGE}`, { key: 'wrong-key' })).status).toBe(401);
    const member = await get(`/admin/stats${RANGE}`, { role: 'member' });
    expect(member.status).toBe(403);
    expect(member.body.error?.code).toBe('FORBIDDEN');
  });

  test('rejects a bad range', async () => {
    for (const q of [
      '?from=2026-03-02T00:00:00Z&to=2026-03-01T00:00:00Z',
      '?from=2026-03-01T00:00:00Z&to=2026-03-01T00:00:00Z',
      '?from=2025-01-01T00:00:00Z&to=2026-03-01T00:00:00Z',
      '?from=yesterday',
    ]) {
      const res = await get(`/admin/stats${q}`);
      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('VALIDATION_ERROR');
    }
    expect((await get('/admin/stats?from=2025-03-01T00:00:00Z&to=2026-03-01T00:00:00Z')).status).toBe(200);
  });

  test('defaults to the last 30 days', async () => {
    const res = await get('/admin/stats');
    expect(res.status).toBe(200);
    const body = AdminStatsResponse.parse(res.body);
    const to = Date.parse(body.range.to);
    expect(Math.abs(to - Date.now())).toBeLessThan(60_000);
    expect(to - Date.parse(body.range.from)).toBe(30 * 86_400_000);
    expect(body.daily.length).toBeGreaterThanOrEqual(30);
    expect(body.totals.requests).toBe(0);
  });

  test('totals, daily buckets, cost, users, styles and quality', async () => {
    const res = await get(`/admin/stats${RANGE}`);
    expect(res.status).toBe(200);
    const s = AdminStatsResponse.parse(res.body);

    expect(s.range).toEqual({ from: '2026-03-01T00:00:00.000Z', to: '2026-03-03T00:00:00.000Z' });
    expect(s.totals).toEqual({
      requests: 2,
      batches: 2,
      previews: 3,
      previewsFailed: 2,
      finals: 1,
      finalsFailed: 1,
      costInr: 25.9,
      avgFirstPreviewSec: 20,
      avgFinalSec: 44,
    });

    // Asia/Kolkata days: R2 at 20:00 UTC on 1 March is 2 March in India.
    expect(s.daily).toEqual([
      { date: '2026-03-01', requests: 1, batches: 1, finals: 1, costInr: 20.9 },
      { date: '2026-03-02', requests: 1, batches: 1, finals: 0, costInr: 5 },
      { date: '2026-03-03', requests: 0, batches: 0, finals: 0, costInr: 0 },
    ]);

    expect(s.costByStage).toEqual([
      { stage: 'finalize', calls: 1, costInr: 10 },
      { stage: 'preview', calls: 6, costInr: 10 },
      { stage: 'exemplar', calls: 1, costInr: 5 },
      { stage: 'read', calls: 1, costInr: 0.5 },
      { stage: 'judge', calls: 1, costInr: 0.2 },
      { stage: 'pack_text', calls: 1, costInr: 0.1 },
      { stage: 'preview_check', calls: 1, costInr: 0.1 },
    ]);

    // Percentiles (continuous) over successful calls only.
    expect(s.costByModel).toEqual([
      { model: 'gemini-3-pro-image', provider: 'google', calls: 1, costInr: 10, p50Ms: 40_000, p90Ms: 40_000 },
      { model: 'gpt-image-2', provider: 'openai', calls: 2, costInr: 9, p50Ms: 40_000, p90Ms: 48_000 },
      { model: 'gemini-3.1-flash-image', provider: 'google', calls: 5, costInr: 6, p50Ms: 15_000, p90Ms: 19_000 },
      { model: 'gpt-4.1', provider: 'openai', calls: 4, costInr: 0.9, p50Ms: 2500, p90Ms: 4400 },
    ]);

    expect(s.byUser).toEqual([
      { actorUserId: U1, requests: 1, batches: 1, finals: 1, costInr: 20.9 },
      { actorUserId: U2, requests: 1, batches: 1, finals: 0, costInr: 0 },
    ]);

    // Every non-retired style, zeros included; B counts both batches it appeared in.
    expect(s.styles).toHaveLength(liveStyles);
    expect(s.styles.find((x) => x.styleId === styleA)).toMatchObject({ batches: 1, picks: 1, finals: 1, costInr: 16.4 });
    expect(s.styles.find((x) => x.styleId === styleB)).toMatchObject({ batches: 2, picks: 1, finals: 0, costInr: 4 });
    const rest = s.styles.filter((x) => x.styleId !== styleA && x.styleId !== styleB);
    expect(rest.length).toBe(liveStyles - 2);
    expect(rest.every((x) => x.batches === 0 && x.picks === 0 && x.finals === 0 && x.costInr === 0 && x.status !== 'RETIRED')).toBe(true);
    expect(s.styles[0]!.familySlug.length).toBeGreaterThan(0);

    expect(s.quality).toEqual({ judged: 2, avgOnStyle: 3, avgAppeal: 3.5, avgComposition: 4, textRetryRate: 0.2, refusalRate: 0.3333 });

    expect(s.models).toEqual({
      preview: [
        { model: 'gemini-3.1-flash-image', count: 2, share: 0.6667 },
        { model: 'gpt-image-2', count: 1, share: 0.3333 },
      ],
      final: [{ model: 'gemini-3-pro-image', count: 1, share: 1 }],
    });
  });

  test('an empty range gives zeros and nulls, not errors', async () => {
    const res = await get('/admin/stats?from=2026-01-01T00:00:00%2B05:30&to=2026-01-02T00:00:00%2B05:30');
    expect(res.status).toBe(200);
    const s = AdminStatsResponse.parse(res.body);
    expect(s.daily.map((d) => d.date)).toEqual(['2026-01-01']);
    expect(s.totals).toMatchObject({ requests: 0, costInr: 0, avgFirstPreviewSec: null, avgFinalSec: null });
    expect(s.quality).toEqual({ judged: 0, avgOnStyle: null, avgAppeal: null, avgComposition: null, textRetryRate: null, refusalRate: null });
    expect(s.costByModel).toEqual([]);
    expect(s.models).toEqual({ preview: [], final: [] });
    expect(s.styles).toHaveLength(liveStyles);
  });

  test('istDay uses Asia/Kolkata', () => {
    expect(istDay(at('2026-03-01T18:29:59Z'))).toBe('2026-03-01');
    expect(istDay(at('2026-03-01T18:30:00Z'))).toBe('2026-03-02');
  });
});
