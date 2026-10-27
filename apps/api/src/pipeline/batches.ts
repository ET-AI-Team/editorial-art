import { BatchPlan, type BatchKind, type BatchPlanEntry, type SensitivityLevel } from '@editorial-art/shared-types';
import { db } from '../lib/db';
import { env } from '../lib/env';
import { StageError } from '../lib/errors';
import { logger } from '../lib/logger';
import { artistKey, chooseByArtist, chooseReferences, nearestApprovedReferences, type RefCandidate } from '../library/references';
import { stylesByIds, styleAllowed, type StyleView } from '../library/styles';
import { enqueue } from '../queues/queues';
import { embedText } from './ai';
import { emitBatchCreated, emitRequestStatus } from './events';
import { moveRequest } from './state';
import type { PeopleEntry } from './read';

/**
 * Making a batch of four (Step 6.4): which direction and style each option uses, and which three
 * references go with it. The plan is stored on the batch so a retry uses the same choices.
 *
 * References: each option takes its three from one artist, and the four options take four
 * different artists where the style has that many, preferring artists this request has not
 * used yet. A pinned reference overrides that: every option gets the pin and the two nearest
 * references by the same artist. References the editor chose override it entirely: every option
 * gets exactly those, in that order, and a "More" batch made from such a batch keeps them.
 */

export interface CreateBatchInput {
  requestId: string;
  kind: BatchKind;
  requestedBy: string;
  styleId?: string;
  fromOptionId?: string;
  fromBatchId?: string;
  seriesOfRequestId?: string;
  /** ANOTHER_STYLE only; INITIAL takes the request's own pin. */
  pinnedReferenceId?: string;
  /** ANOTHER_STYLE only; INITIAL takes the request's own choice, MORE its source batch's. */
  referenceIds?: string[];
}

export const NOT_THIS_STYLE = "These references don't belong to this style.";

/**
 * References the editor chose must be distinct approved references of the batch's style. They
 * may come from different artists; that is allowed and logged. Returns the ids in the given order.
 */
export async function validateReferenceChoice(referenceIds: string[], styleId: string, log: Record<string, unknown> = {}): Promise<string[]> {
  if (!referenceIds.length || referenceIds.length > 3 || new Set(referenceIds).size !== referenceIds.length) {
    throw new StageError('VALIDATION_ERROR', 'Choose 1 to 3 different references.', false);
  }
  const rows = await db.styleReference.findMany({ where: { id: { in: referenceIds } }, select: { id: true, styleId: true, status: true, artistId: true } });
  const ok = referenceIds.every((id) => rows.some((r) => r.id === id && r.styleId === styleId && r.status === 'APPROVED'));
  if (!ok) throw new StageError('VALIDATION_ERROR', NOT_THIS_STYLE, false);
  const artists = new Set(rows.map(artistKey));
  if (artists.size > 1) logger.info({ ...log, styleId, referenceIds, artists: artists.size }, 'mixed_artists');
  return referenceIds;
}

/** A stored choice is re-checked; references retired since are dropped, and nothing left means the automatic pick. */
async function keepChosen(referenceIds: string[], styleId: string, eaRequestId: string): Promise<string[] | null> {
  const rows = await db.styleReference.findMany({ where: { id: { in: referenceIds }, styleId, status: 'APPROVED' }, select: { id: true } });
  const kept = referenceIds.filter((id) => rows.some((r) => r.id === id));
  if (kept.length < referenceIds.length) logger.warn({ eaRequestId, dropped: referenceIds.filter((id) => !kept.includes(id)) }, 'chosen_references_dropped');
  return kept.length ? kept : null;
}

/** A pin must be an approved reference of the batch's style. */
export async function validatePin(referenceId: string, styleId: string): Promise<{ id: string; artistId: string | null }> {
  const ref = await db.styleReference.findUnique({ where: { id: referenceId }, select: { id: true, styleId: true, status: true, artistId: true } });
  if (!ref || ref.styleId !== styleId || ref.status !== 'APPROVED') {
    throw new StageError('VALIDATION_ERROR', 'The pinned reference must be an approved reference of the chosen style.', false);
  }
  return { id: ref.id, artistId: ref.artistId };
}

/** The pin plus the two references by the same artist nearest to this option's idea. */
async function pinnedReferences(pin: { id: string; artistId: string | null }, styleId: string, candidates: RefCandidate[], vector: number[] | null): Promise<string[]> {
  const sameArtist = (c: RefCandidate) => c.id !== pin.id && c.artistId === pin.artistId;
  let mates = candidates.filter(sameArtist);
  if (mates.length < 2 && pin.artistId) mates = (await nearestApprovedReferences(styleId, vector, 12, { artistId: pin.artistId })).filter(sameArtist);
  const nearest = [...mates].sort((a, b) => Number(b.similarity) - Number(a.similarity) || b.pickCount - a.pickCount).slice(0, 2);
  return [pin.id, ...nearest.map((c) => c.id)];
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
  let pin: { id: string; artistId: string | null } | null = null;
  let chosenRefs: string[] | null = null;
  if (input.kind === 'ANOTHER_STYLE') {
    if (!input.styleId) throw new StageError('VALIDATION_ERROR', 'Choose a style.', false);
    if (input.pinnedReferenceId && input.referenceIds) throw new StageError('VALIDATION_ERROR', 'Send either referenceIds or pinnedReferenceId, not both.', false);
    if (input.pinnedReferenceId) pin = await validatePin(input.pinnedReferenceId, input.styleId);
    if (input.referenceIds) chosenRefs = await validateReferenceChoice(input.referenceIds, input.styleId, { eaRequestId: request.publicId });
    slots = planSlots('ANOTHER_STYLE', directions, { styleId: input.styleId });
  } else if (input.kind === 'MORE') {
    // "More" keeps the references the editor chose for the batch it repeats.
    let source: { styleId: string | null; directionPlan: unknown } | null;
    if (input.fromOptionId) {
      const from = await db.option.findFirst({ where: { id: input.fromOptionId, requestId: request.id }, include: { batch: { select: { styleId: true, directionPlan: true } } } });
      if (!from) throw new StageError('NOT_FOUND', 'That option is not part of this request.', false);
      slots = planSlots('MORE', directions, { styleId: from.styleId, startDirectionId: from.directionId });
      source = from.batch;
    } else {
      const from = input.fromBatchId
        ? await db.batch.findFirst({ where: { id: input.fromBatchId, requestId: request.id }, include: { options: { orderBy: { index: 'asc' } } } })
        : await db.batch.findFirst({ where: { requestId: request.id }, orderBy: { seq: 'desc' }, include: { options: { orderBy: { index: 'asc' } } } });
      if (!from) throw new StageError('NOT_FOUND', 'There is no batch to repeat.', false);
      slots = planSlots('MORE', directions, { perEntryStyles: from.options.map((o) => o.styleId), styleId: from.styleId ?? undefined });
      source = from;
    }
    const plan = BatchPlan.safeParse(source.directionPlan);
    const inherited = plan.success ? plan.data.chosenReferenceIds : null;
    if (inherited?.length && source.styleId && slots.every((s) => s.styleId === source.styleId)) {
      chosenRefs = await keepChosen(inherited, source.styleId, request.publicId);
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
    if (request.referenceIds.length && request.styleId) {
      // Checked when the request was made, like a pin.
      chosenRefs = await keepChosen(request.referenceIds, request.styleId, request.publicId);
    }
    if (request.pinnedReferenceId && request.styleId) {
      // Checked when the request was made; a pin retired since then is dropped, not fatal.
      pin = await validatePin(request.pinnedReferenceId, request.styleId).catch(() => {
        logger.warn({ eaRequestId: request.publicId, referenceId: request.pinnedReferenceId }, 'pinned_reference_dropped');
        return null;
      });
    }
  }

  const styles = await stylesByIds(slots.map((s) => s.styleId));
  for (const slot of slots) {
    const style = styles.get(slot.styleId);
    if (!style || style.status !== 'LIVE') throw new StageError('STYLE_NOT_LIVE', 'That style is not available.', false);
    if (!styleAllowed(style, level)) throw new StageError('STYLE_NOT_ALLOWED_FOR_STORY', `"${style.label}" isn't used for stories like this one.`, false);
  }

  // References: nearest to each direction's idea within the option's style, one artist per
  // option, avoiding artists and references this request already used.
  const previous = await db.option.findMany({ where: { requestId: request.id }, select: { referenceIds: true } });
  const used = new Map<string, number>();
  for (const id of previous.flatMap((o) => o.referenceIds)) used.set(id, (used.get(id) ?? 0) + 1);
  const previousRefs = used.size ? await db.styleReference.findMany({ where: { id: { in: [...used.keys()] } }, select: { id: true, artistId: true } }) : [];
  const usedArtists = new Set(previousRefs.map(artistKey));
  const batchArtists = new Map<string, number>();
  const vectors = new Map<string, number[] | null>();
  const entries: BatchPlanEntry[] = [];
  for (const [index, slot] of slots.entries()) {
    const direction = directions.find((x) => x.id === slot.directionId)!;
    const people = peopleFor(direction.peopleDepicted, styles.get(slot.styleId)!, level);
    const entry = { index, directionId: slot.directionId, styleId: slot.styleId, likenessIds: people.likenessIds, peopleMode: people.mode, seriesSourceOptionId };
    if (chosenRefs) {
      // The editor's choice: exactly these, in this order, with no embedding or artist pick.
      entries.push({ ...entry, referenceIds: chosenRefs });
      continue;
    }
    if (!vectors.has(direction.id)) {
      vectors.set(direction.id, await embedText({ stage: 'embed', requestId: request.id }, `${direction.idea}\n${brief.thesis}`).catch(() => null));
    }
    const vector = vectors.get(direction.id) ?? null;
    const candidates = await nearestApprovedReferences(slot.styleId, vector);
    const seriesFirst = candidates.filter((c) => seriesRefIds.includes(c.id));
    let chosen: string[];
    if (pin) {
      chosen = await pinnedReferences(pin, slot.styleId, candidates, vector);
    } else if (seriesFirst.length) {
      chosen = [...seriesFirst, ...chooseReferences(candidates.filter((c) => !seriesRefIds.includes(c.id)), used)].slice(0, 3).map((c) => c.id);
    } else {
      const picked = chooseByArtist(candidates, used, batchArtists, usedArtists);
      if (picked.artistKey) batchArtists.set(picked.artistKey, (batchArtists.get(picked.artistKey) ?? 0) + 1);
      chosen = picked.refs.map((c) => c.id);
    }
    for (const id of chosen) used.set(id, (used.get(id) ?? 0) + 1);
    entries.push({ ...entry, referenceIds: chosen });
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
        directionPlan: { kind: input.kind, entries, promptDropped: false, pinnedReferenceId: pin?.id ?? null, chosenReferenceIds: chosenRefs } as object,
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
