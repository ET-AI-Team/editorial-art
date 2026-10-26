import { z } from 'zod';
import { Id } from './common';
import { BatchKind } from './states';

/** What one option in a batch will be made from. Stored in Batch.directionPlan. */
export const BatchPlanEntry = z
  .object({
    index: z.number().int().min(0).max(3),
    directionId: Id,
    styleId: Id,
    referenceIds: z.array(Id).max(3),
    likenessIds: z.array(Id).max(2),
    peopleMode: z.enum(['illustrated', 'symbolised', 'none']),
    seriesSourceOptionId: Id.nullable(),
  })
  .strict();
export type BatchPlanEntry = z.infer<typeof BatchPlanEntry>;

export const BatchPlan = z
  .object({
    kind: BatchKind,
    entries: z.array(BatchPlanEntry).length(4),
    promptDropped: z.boolean().default(false),
  })
  .strict();
export type BatchPlan = z.infer<typeof BatchPlan>;
