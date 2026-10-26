import { Queue, type JobsOptions } from 'bullmq';
import { env } from '../lib/env';
import { redis } from '../lib/redis';

/**
 * Queue names and job payloads. Job ids are deterministic so enqueueing the same work twice is a
 * no-op; the database, not Redis, is the record of what happened.
 */

export const QUEUES = {
  read: 'read',
  preview: 'preview',
  finalize: 'finalize',
  pack: 'pack',
  library: 'library',
} as const;
export type QueueName = keyof typeof QUEUES;

export interface ReadJob {
  requestId: string;
}
export interface PreviewJob {
  optionId: string;
}
export interface FinalizeJob {
  optionId: string;
}
export interface PackJob {
  optionId: string;
}
export type LibraryJob =
  | { kind: 'exemplar'; styleId: string; subject: string; useApprovedAsRefs: boolean }
  | { kind: 'describe'; referenceId: string };

const ATTEMPTS: Record<QueueName, number> = { read: 3, preview: 2, finalize: 2, pack: 3, library: 2 };
const BACKOFF_MS: Record<QueueName, number> = { read: 2_000, preview: 3_000, finalize: 5_000, pack: 3_000, library: 5_000 };

export function jobOptions(name: QueueName, jobId: string): JobsOptions {
  return {
    jobId,
    attempts: ATTEMPTS[name],
    backoff: { type: 'exponential', delay: BACKOFF_MS[name] },
    removeOnComplete: { age: 86_400, count: 5_000 },
    removeOnFail: { age: 604_800 },
  };
}

const queues = new Map<QueueName, Queue>();

export function queue(name: QueueName): Queue {
  let q = queues.get(name);
  if (!q) {
    q = new Queue(QUEUES[name], { connection: redis(), prefix: env().EA_QUEUE_PREFIX });
    queues.set(name, q);
  }
  return q;
}

export async function closeQueues(): Promise<void> {
  await Promise.all([...queues.values()].map((q) => q.close()));
  queues.clear();
}

export const enqueue = {
  read: (job: ReadJob) => queue('read').add('read', job, jobOptions('read', `read-${job.requestId}`)),
  preview: (job: PreviewJob, attempt: number) => queue('preview').add('preview', job, jobOptions('preview', `preview-${job.optionId}-${attempt}`)),
  finalize: (job: FinalizeJob, attempt: number) => queue('finalize').add('finalize', job, jobOptions('finalize', `finalize-${job.optionId}-${attempt}`)),
  pack: (job: PackJob, attempt: number) => queue('pack').add('pack', job, jobOptions('pack', `pack-${job.optionId}-${attempt}`)),
  library: (job: LibraryJob, id: string) => queue('library').add(job.kind, job, jobOptions('library', `library-${id}`)),
};

/** True when a job with this id is waiting, delayed or active. */
export async function hasLiveJob(name: QueueName, jobId: string): Promise<boolean> {
  const job = await queue(name).getJob(jobId);
  if (!job) return false;
  const state = await job.getState();
  return state === 'waiting' || state === 'active' || state === 'delayed' || state === 'prioritized' || state === 'waiting-children';
}
