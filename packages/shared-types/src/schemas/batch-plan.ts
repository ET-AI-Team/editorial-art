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
    /** The main subject's official logo, when this option's direction asked for it and every gate allowed it. */
    brandLogoId: Id.nullable().default(null),
  })
  .strict();
export type BatchPlanEntry = z.infer<typeof BatchPlanEntry>;

export const BatchPlan = z
  .object({
    kind: BatchKind,
    entries: z.array(BatchPlanEntry).length(4),
    promptDropped: z.boolean().default(false),
    /** The reference every option of this batch was made with, when the editor pinned one. */
    pinnedReferenceId: Id.nullable().default(null),
    /** The references every option of this batch was made with, when the editor chose them. */
    chosenReferenceIds: z.array(Id).max(3).nullable().default(null),
  })
  .strict();
export type BatchPlan = z.infer<typeof BatchPlan>;
