import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { resetDb } from '../../test/db';
import { db } from '../lib/db';
import { chooseByArtist, chooseReferences, pickArtist, type RefCandidate } from './references';
import { liveStyles, seedStyles, styleAllowed, styleBadges } from './styles';

beforeAll(resetDb);
afterAll(() => db.$disconnect());

describe('style library', () => {
  test('seeding loads 12 families and 48 styles and is safe to repeat', async () => {
    await db.styleFamily.create({ data: { slug: 'illustration', label: 'Illustration', sortOrder: 99 } });
    expect(await seedStyles()).toEqual({ families: 12, styles: 48 });
    await db.style.update({ where: { slug: 'ink-wash' }, data: { status: 'LIVE' } });
    await seedStyles();
    expect(await db.style.count()).toBe(48);
    // A family that left the library, with no styles, is gone.
    expect(await db.styleFamily.count()).toBe(12);
    expect((await db.style.findUniqueOrThrow({ where: { slug: 'ink-wash' }, include: { family: true } })).family.slug).toBe('drawing-sketch');
    // Re-seeding never changes a style's status.
    expect((await liveStyles()).map((s) => s.slug)).toEqual(['ink-wash']);
  });

  test('sensitivity decides which styles are allowed', async () => {
    const styles = new Map((await db.style.findMany()).map((s) => [s.slug, { slug: s.slug, safety: s.safety as never }]));
    expect(styleAllowed(styles.get('clay-puppet')!, 'NONE')).toBe(true);
    expect(styleAllowed(styles.get('clay-puppet')!, 'ELEVATED')).toBe(false);
    expect(styleAllowed(styles.get('editorial-cartoon')!, 'ELEVATED')).toBe(false);
    expect(styleAllowed(styles.get('charcoal')!, 'HIGH')).toBe(true);
    expect(styleAllowed(styles.get('oil-impasto')!, 'HIGH')).toBe(false);
    expect(styleAllowed(styles.get('charcoal')!, 'BLOCKED')).toBe(false);
  });

  test('badges say what a style cannot do', () => {
    expect(styleBadges({ safety: { allowsPeople: false, allowsRealPeople: false, allowsSensitive: true, photoreal: true } })).toEqual(['Objects only', 'Good for sensitive stories']);
  });
});

describe('reference choice', () => {
  const ref = (id: string, similarity: number, subject: string, pickCount = 0, artistId: string | null = null): RefCandidate => ({ id, url: `u/${id}`, subjects: [subject], similarity, pickCount, artistId });

  test('nearest first, at most two sharing a subject', () => {
    const chosen = chooseReferences([ref('a', 0.9, 'money'), ref('b', 0.89, 'money'), ref('c', 0.88, 'money'), ref('d', 0.7, 'city')], new Map());
    expect(chosen.map((c) => c.id)).toEqual(['a', 'b', 'd']);
  });

  test('picked references rise; ones already used in this request sink', () => {
    const chosen = chooseReferences([ref('a', 0.8, 'x'), ref('b', 0.79, 'y', 20), ref('c', 0.78, 'z')], new Map([['a', 3]]), 2);
    expect(chosen.map((c) => c.id)).toEqual(['b', 'c']);
  });

  test('fills from what exists when there are fewer than asked', () => {
    expect(chooseReferences([ref('a', 0.5, 'x')], new Map())).toHaveLength(1);
  });

  test('one artist per option, a different artist for each option of a batch', () => {
    const candidates = ['a', 'b', 'c', 'd'].flatMap((artist, i) =>
      [0, 1, 2, 3].map((n) => ref(`${artist}${n}`, 0.9 - i * 0.05 - n * 0.01, ['money', 'city', 'chart', 'sky'][n]!, 0, artist))
    );
    const inBatch = new Map<string, number>();
    const artists: string[] = [];
    for (let option = 0; option < 4; option++) {
      const picked = chooseByArtist(candidates, new Map(), inBatch, new Set());
      expect(picked.refs).toHaveLength(3);
      expect(new Set(picked.refs.map((r) => r.artistId))).toEqual(new Set([picked.artistKey]));
      inBatch.set(picked.artistKey!, (inBatch.get(picked.artistKey!) ?? 0) + 1);
      artists.push(picked.artistKey!);
    }
    expect(artists).toEqual(['a', 'b', 'c', 'd']);
  });

  test('artists used earlier in the request wait their turn; with fewer artists than options, the least used repeats', () => {
    const groups = [
      { key: 'a', score: 0.9 },
      { key: 'b', score: 0.8 },
    ];
    expect(pickArtist(groups, new Map(), new Set(['a']))).toBe('b');
    expect(pickArtist(groups, new Map([['b', 1]]), new Set(['a']))).toBe('a');
    expect(pickArtist(groups, new Map([['a', 2], ['b', 1]]), new Set())).toBe('b');
    expect(pickArtist([], new Map(), new Set())).toBeNull();
  });

  test('references without an artist still fill three slots, led by a different one per option', () => {
    const candidates = [ref('x', 0.9, 'money'), ref('y', 0.8, 'city'), ref('z', 0.7, 'sky'), ref('w', 0.6, 'chart')];
    const first = chooseByArtist(candidates, new Map(), new Map(), new Set());
    const second = chooseByArtist(candidates, new Map(), new Map([[first.artistKey!, 1]]), new Set());
    expect(first.refs.map((r) => r.id)).toEqual(['x', 'y', 'z']);
    expect(second.refs[0]!.id).toBe('y');
    expect(second.refs).toHaveLength(3);
  });
});
