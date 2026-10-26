import { Worker, type Job, type Processor } from 'bullmq';
import { env } from '../lib/env';
import { StageError } from '../lib/errors';
import { logger } from '../lib/logger';
import { redis } from '../lib/redis';
import { db } from '../lib/db';
import { failFinal, finalFailureReason, runFinalize } from '../pipeline/finalize';
import { failPack, runPack } from '../pipeline/pack';
import { failPreview, runPreview } from '../pipeline/preview';
import { runRead } from '../pipeline/read';
import { moveRequest } from '../pipeline/state';
import { emitRequestStatus } from '../pipeline/events';
import { QUEUES, type FinalizeJob, type LibraryJob, type PackJob, type PreviewJob, type QueueName, type ReadJob } from '../queues/queues';

/**
 * BullMQ workers, one per queue, with the stall settings design-pipeline uses. Each worker body
 * is a stage function that is safe to run twice. When a job has used its last attempt, the
 * matching `fail*` function records the outcome so nothing is left spinning.
 */

const STALL = { lockDuration: 300_000, stalledInterval: 30_000, maxStalledCount: 2 };

/** Errors not worth another attempt: refusals, caps, and anything marked not retryable. */
function permanent(error: unknown): boolean {
  return error instanceof StageError && !error.retryable;
}

function lastAttempt(job: Job): boolean {
  return job.attemptsMade >= (job.opts.attempts ?? 1);
}

const workers: Worker[] = [];

function start<T>(name: QueueName, concurrency: number, run: (data: T) => Promise<void>, onGiveUp: (data: T, error: unknown) => Promise<void>): void {
  const processor: Processor<T> = async (job) => {
    try {
      await run(job.data);
    } catch (error) {
      if (permanent(error)) {
        await onGiveUp(job.data, error);
        return;
      }
      throw error;
    }
  };
  const worker = new Worker<T>(QUEUES[name], processor, { connection: redis(), prefix: env().EA_QUEUE_PREFIX, concurrency, ...STALL });
  worker.on('failed', (job, error) => {
    if (!job) return;
    logger.warn({ queue: name, jobId: job.id, attempt: job.attemptsMade, err: error.message }, 'job_failed');
    if (lastAttempt(job)) void onGiveUp(job.data, error).catch((err) => logger.error({ err, queue: name }, 'give_up_failed'));
  });
  worker.on('error', (err) => logger.error({ err, queue: name }, 'worker_error'));
  workers.push(worker);
}

export interface LibraryProcessor {
  (job: LibraryJob): Promise<void>;
}

export function startWorkers(processLibrary?: LibraryProcessor): void {
  const c = env();
  start<ReadJob>('read', c.EA_READ_CONCURRENCY, (d) => runRead(d.requestId), async (d, error) => {
    const request = await db.request.findUnique({ where: { id: d.requestId }, select: { publicId: true } });
    const reason = error instanceof StageError && error.code === 'SPEND_CAP_REACHED' ? error.message : "We couldn't read this article. Check the text and try again.";
    if (request && (await moveRequest(d.requestId, 'FAILED', { failureCode: error instanceof StageError ? error.code : 'READ_FAILED', failureReason: reason }, ['RECEIVED', 'READING']))) {
      emitRequestStatus(request.publicId, 'FAILED');
    }
  });
  start<PreviewJob>('preview', c.EA_PREVIEW_CONCURRENCY, (d) => runPreview(d.optionId), (d, error) => failPreview(d.optionId, error));
  start<FinalizeJob>('finalize', c.EA_FINALIZE_CONCURRENCY, (d) => runFinalize(d.optionId), (d, error) => failFinal(d.optionId, finalFailureReason(error)));
  start<PackJob>('pack', c.EA_PACK_CONCURRENCY, (d) => runPack(d.optionId), (d) => failPack(d.optionId));
  if (processLibrary) {
    start<LibraryJob>('library', c.EA_LIBRARY_CONCURRENCY, processLibrary, async (d, error) => {
      logger.warn({ job: d, err: error instanceof Error ? error.message : String(error) }, 'library_job_gave_up');
    });
  }
}

/** Waits for active jobs to finish (bounded by systemd's stop timeout), then stops taking new ones. */
export async function stopWorkers(): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
  workers.length = 0;
}
