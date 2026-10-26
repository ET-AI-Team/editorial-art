import { describe, expect, test } from 'bun:test';
import { selectKept } from './select';

const item = (artist: string, onStyle: number, id: string) => ({ artist: { slug: artist }, onStyle, id });

describe('which screened artworks a style keeps', () => {
  test('the best of each artist, capped per artist', () => {
    const items = Array.from({ length: 12 }, (_, i) => item('a', i % 10, `a${i}`));
    const kept = selectKept(items, 8, 24);
    expect(kept).toHaveLength(8);
    expect(Math.min(...kept.map((k) => k.onStyle))).toBeGreaterThanOrEqual(2);
  });

  test('round-robin across artists up to the style cap, best artist first', () => {
    const items = [
      ...Array.from({ length: 10 }, (_, i) => item('a', 9, `a${i}`)),
      ...Array.from({ length: 10 }, (_, i) => item('b', 8, `b${i}`)),
      ...Array.from({ length: 10 }, (_, i) => item('c', 7, `c${i}`)),
      ...Array.from({ length: 10 }, (_, i) => item('d', 10, `d${i}`)),
    ];
    const kept = selectKept(items, 8, 24);
    expect(kept).toHaveLength(24);
    expect(kept[0]!.artist.slug).toBe('d');
    const per = new Map<string, number>();
    for (const k of kept) per.set(k.artist.slug, (per.get(k.artist.slug) ?? 0) + 1);
    expect([...per.values()].every((n) => n === 6)).toBe(true);
  });
});
