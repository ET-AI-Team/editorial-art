import type { BatchStatus, OptionState, RequestStatus } from '@editorial-art/shared-types';
import { db } from '../lib/db';

/**
 * The state machines from Step 1.4. Every move is a conditional update on the current state, so
 * two workers can never both move the same row: the one whose update touches a row wins.
 */

export const REQUEST_MOVES: Record<RequestStatus, RequestStatus[]> = {
  RECEIVED: ['READING', 'FAILED', 'CANCELLED'],
  READING: ['DIRECTIONS_READY', 'NEEDS_PEOPLE_CONFIRM', 'FAILED', 'CANCELLED', 'RECEIVED'],
  NEEDS_PEOPLE_CONFIRM: ['DIRECTIONS_READY', 'FAILED', 'CANCELLED', 'EXPIRED'],
  DIRECTIONS_READY: ['ACTIVE', 'FAILED', 'CANCELLED'],
  ACTIVE: ['HAS_FINAL', 'CANCELLED', 'EXPIRED'],
  HAS_FINAL: ['EXPIRED'],
  FAILED: ['EXPIRED'],
  CANCELLED: ['EXPIRED'],
  EXPIRED: [],
};

export const OPTION_MOVES: Record<OptionState, OptionState[]> = {
  // PENDING -> PREVIEW_READY: a story redraw abandoned before it started keeps its first preview.
  PENDING: ['GENERATING', 'PREVIEW_FAILED', 'BLOCKED', 'PREVIEW_READY'],
  GENERATING: ['PREVIEW_READY', 'PREVIEW_FAILED', 'BLOCKED', 'PENDING'],
  // PREVIEW_READY -> PENDING: the one story redraw of a batch's weakest option (preview.ts).
  PREVIEW_READY: ['FINALIZING', 'PENDING'],
  PREVIEW_FAILED: [],
  BLOCKED: [],
  FINALIZING: ['FINAL_READY', 'FINAL_FAILED'],
  FINAL_READY: ['PACKING'],
  FINAL_FAILED: ['FINALIZING'],
  PACKING: ['PACK_READY', 'PACK_FAILED'],
  PACK_READY: ['PACKING'],
  PACK_FAILED: ['PACKING'],
};

export const BATCH_MOVES: Record<BatchStatus, BatchStatus[]> = {
  QUEUED: ['RUNNING', 'CANCELLED', 'READY', 'PARTIAL', 'FAILED'],
  RUNNING: ['READY', 'PARTIAL', 'FAILED', 'CANCELLED'],
  READY: [],
  PARTIAL: [],
  FAILED: [],
  CANCELLED: [],
};

export function canMove<S extends string>(table: Record<S, S[]>, from: S, to: S): boolean {
  return table[from].includes(to);
}

/** Sources from which `to` can be reached. */
function sourcesOf<S extends string>(table: Record<S, S[]>, to: S): S[] {
  return (Object.keys(table) as S[]).filter((from) => table[from].includes(to));
}

/** Moves a request if it is in one of `from` (default: any state that may move to `to`). */
export async function moveRequest(id: string, to: RequestStatus, data: Record<string, unknown> = {}, from?: RequestStatus[]): Promise<boolean> {
  const allowed = from ?? sourcesOf(REQUEST_MOVES, to);
  const { count } = await db.request.updateMany({ where: { id, status: { in: allowed } }, data: { ...data, status: to } });
  return count === 1;
}

export async function moveOption(id: string, to: OptionState, data: Record<string, unknown> = {}, from?: OptionState[]): Promise<boolean> {
  const allowed = from ?? sourcesOf(OPTION_MOVES, to);
  const { count } = await db.option.updateMany({ where: { id, state: { in: allowed } }, data: { ...data, state: to } });
  return count === 1;
}

export async function moveBatch(id: string, to: BatchStatus, data: Record<string, unknown> = {}, from?: BatchStatus[]): Promise<boolean> {
  const allowed = from ?? sourcesOf(BATCH_MOVES, to);
  const { count } = await db.batch.updateMany({ where: { id, status: { in: allowed } }, data: { ...data, status: to } });
  return count === 1;
}

const PREVIEW_SETTLED: OptionState[] = ['PREVIEW_READY', 'PREVIEW_FAILED', 'BLOCKED', 'FINALIZING', 'FINAL_READY', 'FINAL_FAILED', 'PACKING', 'PACK_READY', 'PACK_FAILED'];
const PREVIEW_OK: OptionState[] = ['PREVIEW_READY', 'FINALIZING', 'FINAL_READY', 'FINAL_FAILED', 'PACKING', 'PACK_READY', 'PACK_FAILED'];

/** A batch's outcome once all of its options have a preview result. Null while any is still working. */
export function batchOutcome(states: OptionState[]): BatchStatus | null {
  if (!states.every((s) => PREVIEW_SETTLED.includes(s))) return null;
  const ok = states.filter((s) => PREVIEW_OK.includes(s)).length;
  if (ok === states.length) return 'READY';
  return ok === 0 ? 'FAILED' : 'PARTIAL';
}
