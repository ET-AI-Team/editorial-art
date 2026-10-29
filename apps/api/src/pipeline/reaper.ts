import { db } from '../lib/db';
import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { redis } from '../lib/redis';
import { enqueue, hasLiveJob, requeueRead } from '../queues/queues';
import { failFinal } from './finalize';
import { failPack } from './pack';
import { failPreview, settleBatch } from './preview';
import { emitRequestStatus } from './events';
import { moveRequest } from './state';

/**
 * Recovers rows a crash or a Redis restart left without a job (Step 6.9). Runs every minute in one
 * process at a time (a Redis lock), and only touches rows older than their stage's normal window.
 */

const MINUTE = 60_000;

async function stale<T extends { updatedAt: Date }>(rows: T[], olderThanMs: number): Promise<T[]> {
  const cutoff = Date.now() - olderThanMs;
  return rows.filter((r) => r.updatedAt.getTime() < cutoff);
}

export async function reapOnce(): Promise<number> {
  let actions = 0;
  const requests = await db.request.findMany({ where: { status: { in: ['RECEIVED', 'READING'] } }, select: { id: true, publicId: true, status: true, updatedAt: true } });
  for (const r of await stale(requests, MINUTE)) {
    if (await hasLiveJob('read', `read-${r.id}`)) continue;
    if (r.status === 'RECEIVED' || Date.now() - r.updatedAt.getTime() < 5 * MINUTE) {
      await requeueRead(r.id);
    } else if (await moveRequest(r.id, 'FAILED', { failureCode: 'INTERRUPTED', failureReason: 'Reading this article was interrupted. Try again.' }, ['READING'])) {
      emitRequestStatus(r.publicId, 'FAILED');
    }
    actions++;
  }

  const options = await db.option.findMany({ where: { state: { in: ['PENDING', 'GENERATING', 'FINALIZING', 'PACKING'] } }, select: { id: true, state: true, previewAttempts: true, storyRedraws: true, updatedAt: true } });
  for (const o of options) {
    const age = Date.now() - o.updatedAt.getTime();
    if (o.state === 'PENDING' || o.state === 'GENERATING') {
      if (age < 10 * MINUTE) continue;
      const live =
        (await hasLiveJob('preview', `preview-${o.id}-1`)) ||
        (await hasLiveJob('preview', `preview-${o.id}-${o.previewAttempts + 1}`)) ||
        (o.storyRedraws > 0 && (await hasLiveJob('preview', `preview-${o.id}-redraw`)));
      if (live) continue;
      if (o.previewAttempts < 2) await enqueue.preview({ optionId: o.id }, o.previewAttempts + 1);
      else await failPreview(o.id, new Error('interrupted'));
      actions++;
    } else if (o.state === 'FINALIZING' && age >= 15 * MINUTE) {
      await failFinal(o.id, 'Finishing this image was interrupted. Try again.');
      actions++;
    } else if (o.state === 'PACKING' && age >= 15 * MINUTE) {
      await failPack(o.id, 'Making the publish pack was interrupted. Try again.');
      actions++;
    }
  }

  const running = await db.batch.findMany({ where: { status: { in: ['QUEUED', 'RUNNING'] } }, select: { id: true, request: { select: { publicId: true } } } });
  for (const b of running) await settleBatch(b.id, b.request.publicId);

  if (actions) logger.info({ actions }, 'reaper_action');
  return actions;
}

let timer: ReturnType<typeof setInterval> | undefined;

export function startReaper(): void {
  const lockKey = `${env().EA_QUEUE_PREFIX}:reaper-lock`;
  timer = setInterval(async () => {
    const got = await redis().set(lockKey, String(process.pid), 'PX', 55_000, 'NX').catch(() => null);
    if (got !== 'OK') return;
    await reapOnce().catch((err) => logger.error({ err }, 'reaper_failed'));
  }, MINUTE);
}

export function stopReaper(): void {
  if (timer) clearInterval(timer);
  timer = undefined;
}
