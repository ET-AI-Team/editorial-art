import type { BatchKind, BatchPlanEntry, SensitivityLevel } from '@editorial-art/shared-types';
import { db } from '../lib/db';
import { env } from '../lib/env';
import { StageError } from '../lib/errors';
import { chooseReferences, nearestApprovedReferences } from '../library/references';
import { stylesByIds, styleAllowed, type StyleView } from '../library/styles';
import { enqueue } from '../queues/queues';
import { embedText } from './ai';
import { emitBatchCreated, emitRequestStatus } from './events';
import { moveRequest } from './state';
import type { PeopleEntry } from './read';

/**
 * Making a batch of four (Step 6.4): which direction and style each option uses, and which three
 * references go with it. The plan is stored on the batch so a retry uses the same choices.
 */

export interface CreateBatchInput {
  requestId: string;
  kind: BatchKind;
  requestedBy: string;
  styleId?: string;
  fromOptionId?: string;
  fromBatchId?: string;
  seriesOfRequestId?: string;
}

interface DirectionRow {
  id: string;
  rank: number;
  idea: string;
  title: string;
  suggestedStyleId: string;
  peopleDepicted: PeopleEntry[];
}

/** The direction and style for each of the four options (pure, see the table in Step 6.4.1). */
export function planSlots(
  kind: BatchKind,
  directions: DirectionRow[],
  opts: { requestStyleId?: string | null; styleId?: string; startDirectionId?: string; perEntryStyles?: string[] }
): { directionId: string; styleId: string }[] {
  const byRank = [...directions].sort((a, b) => a.rank - b.rank);
  const d = (i: number) => byRank[i % byRank.length]!;
  switch (kind) {
    case 'INITIAL':
      return opts.requestStyleId
        ? [0, 1, 0, 1].map((i) => ({ directionId: d(i).id, styleId: opts.requestStyleId! }))
        : [0, 1, 2, 0].map((i) => ({ directionId: d(i).id, styleId: d(i).suggestedStyleId }));
    case 'MORE': {
      const start = Math.max(0, byRank.findIndex((x) => x.id === opts.startDirectionId));
      return [0, 1, 2, 0].map((step, i) => ({
        directionId: d(start + step).id,
        styleId: opts.styleId ?? opts.perEntryStyles?.[i] ?? d(start + step).suggestedStyleId,
      }));
    }
    case 'ANOTHER_STYLE':
      return [0, 1, 2, 0].map((i) => ({ directionId: d(i).id, styleId: opts.styleId! }));
    case 'SERIES_MATCH':
      return [0, 1, 0, 1].map((i) => ({ directionId: d(i).id, styleId: opts.styleId! }));
  }
}

/** People mode for one option, re-checked against the option's actual style. */
export function peopleFor(people: PeopleEntry[], style: StyleView, level: SensitivityLevel): { mode: BatchPlanEntry['peopleMode']; likenessIds: string[] } {
  const effective = people.map((p) => (p.how === 'illustrated' && (!style.safety.allowsRealPeople || level === 'HIGH') ? { ...p, how: 'symbolised' as const } : p));
  const likenessIds = effective.filter((p) => p.how === 'illustrated' && p.likenessId).map((p) => p.likenessId!).slice(0, 2);
  const mode = effective.some((p) => p.how === 'illustrated') ? 'illustrated' : effective.some((p) => p.how === 'symbolised') ? 'symbolised' : 'none';
  return { mode, likenessIds };
}

export async function createBatch(input: CreateBatchInput): Promise<{ batchId: string; seq: number }> {
  const config = env();
  const request = await db.request.findUnique({ where: { id: input.requestId } });
  if (!request) throw new StageError('NOT_FOUND', 'Request not found.', false);
  if (!['DIRECTIONS_READY', 'ACTIVE', 'HAS_FINAL'].includes(request.status)) {
    throw new StageError('INVALID_STATE', 'This request is not ready for more images.', false);
  }
  const level = (request.sensitivity ?? 'NONE') as SensitivityLevel;

  const [running, count] = await Promise.all([
    db.batch.count({ where: { requestId: request.id, status: { in: ['QUEUED', 'RUNNING'] } } }),
    db.batch.count({ where: { requestId: request.id } }),
  ]);
  if (running > 0) throw new StageError('BATCH_IN_PROGRESS', 'Wait for this batch to finish.', false);
  if (count >= config.EA_MAX_BATCHES_PER_REQUEST) {
    throw new StageError('BATCH_LIMIT', `This article already has ${count} batches. Start a new request to keep exploring.`, false);
  }

  const brief = await db.brief.findFirst({ where: { requestId: request.id }, orderBy: { version: 'desc' }, include: { directions: true } });
  if (!brief || !brief.directions.length) throw new StageError('INVALID_STATE', 'This request has no directions yet.', false);
  const directions: DirectionRow[] = brief.directions.map((x) => ({ ...x, peopleDepicted: x.peopleDepicted as unknown as PeopleEntry[] }));

  // Resolve what this kind of batch is based on.
  let slots: { directionId: string; styleId: string }[];
  let seriesSourceOptionId: string | null = null;
  let seriesRefIds: string[] = [];
  if (input.kind === 'ANOTHER_STYLE') {
    if (!input.styleId) throw new StageError('VALIDATION_ERROR', 'Choose a style.', false);
    slots = planSlots('ANOTHER_STYLE', directions, { styleId: input.styleId });
  } else if (input.kind === 'MORE') {
    if (input.fromOptionId) {
      const from = await db.option.findFirst({ where: { id: input.fromOptionId, requestId: request.id } });
      if (!from) throw new StageError('NOT_FOUND', 'That option is not part of this request.', false);
      slots = planSlots('MORE', directions, { styleId: from.styleId, startDirectionId: from.directionId });
    } else {
      const from = input.fromBatchId
        ? await db.batch.findFirst({ where: { id: input.fromBatchId, requestId: request.id }, include: { options: { orderBy: { index: 'asc' } } } })
        : await db.batch.findFirst({ where: { requestId: request.id }, orderBy: { seq: 'desc' }, include: { options: { orderBy: { index: 'asc' } } } });
      if (!from) throw new StageError('NOT_FOUND', 'There is no batch to repeat.', false);
      slots = planSlots('MORE', directions, { perEntryStyles: from.options.map((o) => o.styleId), styleId: from.styleId ?? undefined });
    }
  } else if (input.kind === 'SERIES_MATCH') {
    const source = await db.request.findFirst({ where: { publicId: input.seriesOfRequestId, actorWorkspaceId: request.actorWorkspaceId } });
    const picked = source ? await db.option.findFirst({ where: { requestId: source.id, picked: true, finalUrl: { not: null } }, orderBy: { pickedAt: 'desc' } }) : null;
    if (!source || !picked) throw new StageError('SERIES_NOT_FOUND', 'Pick a previous story that has a final image.', false);
    seriesSourceOptionId = picked.id;
    seriesRefIds = picked.referenceIds;
    slots = planSlots('SERIES_MATCH', directions, { styleId: picked.styleId });
  } else {
    slots = planSlots('INITIAL', directions, { requestStyleId: request.styleId });
  }

  const styles = await stylesByIds(slots.map((s) => s.styleId));
  for (const slot of slots) {
    const style = styles.get(slot.styleId);
    if (!style || style.status !== 'LIVE') throw new StageError('STYLE_NOT_LIVE', 'That style is not available.', false);
    if (!styleAllowed(style, level)) throw new StageError('STYLE_NOT_ALLOWED_FOR_STORY', `"${style.label}" isn't used for stories like this one.`, false);
  }

  // References: nearest to each direction's idea within the option's style, avoiding reuse.
  const previous = await db.option.findMany({ where: { requestId: request.id }, select: { referenceIds: true } });
  const used = new Map<string, number>();
  for (const id of previous.flatMap((o) => o.referenceIds)) used.set(id, (used.get(id) ?? 0) + 1);
  const vectors = new Map<string, number[] | null>();
  const entries: BatchPlanEntry[] = [];
  for (const [index, slot] of slots.entries()) {
    const direction = directions.find((x) => x.id === slot.directionId)!;
    if (!vectors.has(direction.id)) {
      vectors.set(direction.id, await embedText({ stage: 'embed', requestId: request.id }, `${direction.idea}\n${brief.thesis}`).catch(() => null));
    }
    const candidates = await nearestApprovedReferences(slot.styleId, vectors.get(direction.id) ?? null);
    const seriesFirst = candidates.filter((c) => seriesRefIds.includes(c.id));
    const chosen = seriesFirst.length ? [...seriesFirst, ...chooseReferences(candidates.filter((c) => !seriesRefIds.includes(c.id)), used)].slice(0, 3) : chooseReferences(candidates, used);
    for (const c of chosen) used.set(c.id, (used.get(c.id) ?? 0) + 1);
    const people = peopleFor(direction.peopleDepicted, styles.get(slot.styleId)!, level);
    entries.push({
      index,
      directionId: slot.directionId,
      styleId: slot.styleId,
      referenceIds: chosen.map((c) => c.id),
      likenessIds: people.likenessIds,
      peopleMode: people.mode,
      seriesSourceOptionId,
    });
  }

  const singleStyle = new Set(slots.map((s) => s.styleId)).size === 1 ? slots[0]!.styleId : null;
  const batch = await db.$transaction(async (tx) => {
    const last = await tx.batch.findFirst({ where: { requestId: request.id }, orderBy: { seq: 'desc' }, select: { seq: true } });
    return tx.batch.create({
      data: {
        requestId: request.id,
        seq: (last?.seq ?? 0) + 1,
        kind: input.kind,
        styleId: singleStyle,
        directionPlan: { kind: input.kind, entries, promptDropped: false } as object,
        requestedBy: input.requestedBy,
        options: {
          create: entries.map((e) => ({
            requestId: request.id,
            index: e.index,
            directionId: e.directionId,
            styleId: e.styleId,
            referenceIds: e.referenceIds,
            likenessIds: e.likenessIds,
          })),
        },
      },
      include: { options: true },
    });
  });

  if (request.status === 'DIRECTIONS_READY' && (await moveRequest(request.id, 'ACTIVE', {}, ['DIRECTIONS_READY']))) {
    emitRequestStatus(request.publicId, 'ACTIVE');
  }
  await Promise.all(batch.options.map((o) => enqueue.preview({ optionId: o.id }, 1)));
  emitBatchCreated(request.publicId, batch.id, batch.seq);
  return { batchId: batch.id, seq: batch.seq };
}
