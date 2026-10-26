import { describe, expect, test } from 'bun:test';
import { planSlots } from './batches';

const directions = [1, 2, 3].map((rank) => ({ id: `d${rank}`, rank, idea: 'x', title: 't', suggestedStyleId: `s${rank}`, peopleDepicted: [] }));

describe('batch planning (Step 6.4.1)', () => {
  test('first batch with no style: D1, D2, D3, D1 in their own styles', () => {
    expect(planSlots('INITIAL', directions, {})).toEqual([
      { directionId: 'd1', styleId: 's1' },
      { directionId: 'd2', styleId: 's2' },
      { directionId: 'd3', styleId: 's3' },
      { directionId: 'd1', styleId: 's1' },
    ]);
  });

  test('first batch with a chosen style: D1, D2, D1, D2 in that style', () => {
    expect(planSlots('INITIAL', directions, { requestStyleId: 'S' }).map((s) => `${s.directionId}:${s.styleId}`)).toEqual(['d1:S', 'd2:S', 'd1:S', 'd2:S']);
  });

  test('more like an option starts from its direction and keeps its style', () => {
    expect(planSlots('MORE', directions, { styleId: 's2', startDirectionId: 'd2' }).map((s) => `${s.directionId}:${s.styleId}`)).toEqual(['d2:s2', 'd3:s2', 'd1:s2', 'd2:s2']);
  });

  test('another style and series use one style throughout', () => {
    expect(new Set(planSlots('ANOTHER_STYLE', directions, { styleId: 'T' }).map((s) => s.styleId))).toEqual(new Set(['T']));
    expect(planSlots('SERIES_MATCH', directions, { styleId: 'R' }).map((s) => s.directionId)).toEqual(['d1', 'd2', 'd1', 'd2']);
  });
});
