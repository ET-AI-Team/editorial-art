import { describe, expect, test } from 'bun:test';
import { BATCH_MOVES, OPTION_MOVES, REQUEST_MOVES, batchOutcome, canMove } from './state';

describe('state machines', () => {
  test('terminal states go nowhere', () => {
    expect(OPTION_MOVES.PREVIEW_FAILED).toEqual([]);
    expect(OPTION_MOVES.BLOCKED).toEqual([]);
    expect(BATCH_MOVES.READY).toEqual([]);
    expect(REQUEST_MOVES.EXPIRED).toEqual([]);
  });

  test('a preview can be finalized; a failed final can be tried again; nothing skips a step', () => {
    expect(canMove(OPTION_MOVES, 'PREVIEW_READY', 'FINALIZING')).toBe(true);
    expect(canMove(OPTION_MOVES, 'FINAL_FAILED', 'FINALIZING')).toBe(true);
    expect(canMove(OPTION_MOVES, 'PENDING', 'FINAL_READY')).toBe(false);
    expect(canMove(OPTION_MOVES, 'PACK_READY', 'FINALIZING')).toBe(false);
  });

  test('a ready preview can go back once for a story redraw, and comes back ready if the redraw is abandoned', () => {
    expect(canMove(OPTION_MOVES, 'PREVIEW_READY', 'PENDING')).toBe(true);
    expect(canMove(OPTION_MOVES, 'PENDING', 'PREVIEW_READY')).toBe(true);
    expect(canMove(OPTION_MOVES, 'PREVIEW_READY', 'GENERATING')).toBe(false);
    expect(canMove(OPTION_MOVES, 'FINALIZING', 'PENDING')).toBe(false);
  });

  test('a request keeps exploring after a final, but a cancelled one stays cancelled', () => {
    expect(canMove(REQUEST_MOVES, 'ACTIVE', 'HAS_FINAL')).toBe(true);
    expect(canMove(REQUEST_MOVES, 'CANCELLED', 'ACTIVE')).toBe(false);
  });

  test('batch outcome waits for every option, then reports ready, partial or failed', () => {
    expect(batchOutcome(['PREVIEW_READY', 'GENERATING', 'PREVIEW_READY', 'PREVIEW_READY'])).toBeNull();
    expect(batchOutcome(['PREVIEW_READY', 'PREVIEW_READY', 'FINALIZING', 'PACK_READY'])).toBe('READY');
    expect(batchOutcome(['PREVIEW_READY', 'BLOCKED', 'PREVIEW_FAILED', 'PREVIEW_READY'])).toBe('PARTIAL');
    expect(batchOutcome(['BLOCKED', 'PREVIEW_FAILED', 'PREVIEW_FAILED', 'BLOCKED'])).toBe('FAILED');
  });
});
