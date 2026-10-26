import { describe, expect, test } from 'bun:test';
import { clampBoxes, cropWindow } from './crop';

describe('smart crop', () => {
  test('with no subjects, a centred window of the target aspect at full size', () => {
    expect(cropWindow(1600, 900, 1, [])).toEqual({ left: 350, top: 0, width: 900, height: 900 });
  });

  test('slides the window to keep a subject on the right inside it', () => {
    const w = cropWindow(1600, 900, 1, [{ x: 0.75, y: 0.3, w: 0.15, h: 0.4 }])!;
    expect(w.left + w.width).toBeGreaterThanOrEqual(0.9 * 1600);
    expect(w.left).toBeLessThanOrEqual(0.75 * 1600);
  });

  test('returns null when subjects are spread wider than any window can hold', () => {
    expect(cropWindow(1600, 900, 9 / 16, [{ x: 0.05, y: 0.4, w: 0.1, h: 0.2 }, { x: 0.85, y: 0.4, w: 0.1, h: 0.2 }])).toBeNull();
  });

  test('clamps boxes into the image and drops degenerate ones', () => {
    expect(clampBoxes([{ x: -0.1, y: 0.2, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.001, h: 0.3 }])).toEqual([{ x: 0, y: 0.2, w: 0.5, h: 0.5 }]);
  });
});
