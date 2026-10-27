import { describe, expect, test } from 'bun:test';
import { capFlag, selectKept } from './select';

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

describe('keeping more candidates for a person to pick from', () => {
  test('higher caps keep more of each artist and of the style', () => {
    const items = ['a', 'b', 'c', 'd', 'e'].flatMap((a) => Array.from({ length: 20 }, (_, i) => item(a, 10 - i / 10, `${a}${i}`)));
    expect(selectKept(items)).toHaveLength(24);
    expect(selectKept(items, capFlag('15', '--max-per-artist', 8), capFlag('60', '--max-per-style', 24))).toHaveLength(60);
    expect(selectKept(items, 20, 500)).toHaveLength(100);
  });

  test('the cap flags are whole numbers from 1 to 500, or the default', () => {
    expect(capFlag(undefined, '--max-per-artist', 8)).toBe(8);
    for (const bad of ['0', '501', '1.5', 'all']) expect(() => capFlag(bad, '--max-per-style', 24)).toThrow('--max-per-style');
  });
});

describe('research files', () => {
  test('artist names drop a gallery note', async () => {
    const { artistName, slugOf } = await import('./common');
    expect(artistName('Mahalaxmi Karn (via Indigo Arts Gallery)')).toBe('Mahalaxmi Karn');
    expect(artistName('Jamini Roy')).toBe('Jamini Roy');
    expect(slugOf('Zoë Ølsen-Ray')).toBe('zoe-lsen-ray');
  });
});
