import { describeReference, generateExemplar } from '../library/exemplars';
import { logger } from '../lib/logger';
import type { LibraryJob } from '../queues/queues';

/**
 * One library job: an exemplar for a style, or the description of an uploaded reference. The
 * BullMQ worker that calls this is registered with the others (workers/index.ts).
 */
export async function processLibraryJob(job: LibraryJob): Promise<void> {
  if (job.kind === 'exemplar') {
    const outcome = await generateExemplar(job.styleId, job.subject, job.useApprovedAsRefs);
    logger.info({ styleId: job.styleId, outcome: outcome.status, referenceId: outcome.referenceId }, 'library_exemplar_done');
    return;
  }
  await describeReference(job.referenceId);
  logger.info({ referenceId: job.referenceId }, 'library_describe_done');
}
