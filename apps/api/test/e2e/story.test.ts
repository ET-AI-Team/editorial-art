import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { AdminOptionInputs, RequestDetail } from '@editorial-art/shared-types';
import { db } from '../../src/lib/db';
import { ADMIN, ARTICLE, call, liveLibrary, startHarness, until, type Harness } from '../harness';

/**
 * The story redraw with real workers and queues: the weakest preview of a batch goes back once,
 * the batch settles only after it lands, and the editor never loses an option.
 */

let h: Harness;

beforeAll(async () => {
  h = await startHarness();
  await liveLibrary(['ink-wash', 'paper-cut']);
});
afterAll(() => h.stop());

async function settled(requestId: string): Promise<RequestDetail> {
  let d!: RequestDetail;
  await until(async () => {
    d = RequestDetail.parse((await call(h.base, `/requests/${requestId}`)).json);
    return ['READY', 'PARTIAL', 'FAILED'].includes(d.batches[0]?.status ?? '');
  });
  return d;
}

describe('the story redraw, end to end', () => {
  test('a weak preview is redrawn once with a note, the batch settles after it, best story first', async () => {
    const res = await call(h.base, '/requests', { method: 'POST', body: { articleText: ARTICLE, articleTitle: 'FAKE_STORY_LOW Tata Sons rejects Noel Tata objections' } });
    expect(res.status).toBe(202);
    const d = await settled(res.json.requestId as string);
    const batch = d.batches[0]!;
    expect(batch.status).toBe('READY');
    expect(batch.options.every((o) => o.state === 'PREVIEW_READY' && o.previewUrl)).toBe(true);
    // The redrawn house (index 2) now scores 8: D2 9, D3 8, D1 7, D1 7.
    expect(batch.options.map((o) => o.index)).toEqual([1, 2, 0, 3]);

    const redrawn = await db.option.findFirstOrThrow({ where: { batchId: batch.id, index: 2 } });
    expect(redrawn).toMatchObject({ storyScore: 8, storyRedraws: 1 });
    const inputs = AdminOptionInputs.parse((await call(h.base, `/admin/options/${redrawn.id}/inputs`, { headers: ADMIN })).json);
    expect(inputs.story).toMatchObject({ score: 8, redraws: 1 });
    expect(inputs.preview!.prompt).toContain('Make the story clearer:');
    expect(await db.option.count({ where: { batchId: batch.id, storyRedraws: { gt: 0 } } })).toBe(1);
  });

  test('a story that stays weak is redrawn once, never again', async () => {
    const res = await call(h.base, '/requests', { method: 'POST', body: { articleText: ARTICLE.replace('Monday', 'Tuesday'), articleTitle: 'FAKE_STORY_ALWAYS_LOW Tata Sons rejects Noel Tata objections' } });
    const d = await settled(res.json.requestId as string);
    expect(d.batches[0]!.status).toBe('READY');
    const row = await db.request.findFirstOrThrow({ where: { publicId: res.json.requestId as string } });
    // Let any stray job run before counting.
    await new Promise((r) => setTimeout(r, 500));
    expect(await db.attempt.count({ where: { requestId: row.id, stage: 'story_redraw', model: { contains: 'image' } } })).toBe(1);
    expect((await db.option.findMany({ where: { requestId: row.id } })).map((o) => o.storyRedraws).sort()).toEqual([0, 0, 0, 1]);
  });
});
