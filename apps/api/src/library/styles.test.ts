import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { resetDb } from '../../test/db';
import { db } from '../lib/db';
import { chooseReferences, type RefCandidate } from './references';
import { liveStyles, seedStyles, styleAllowed, styleBadges } from './styles';

beforeAll(resetDb);
afterAll(() => db.$disconnect());

describe('style library', () => {
  test('seeding loads 6 families and 24 styles and is safe to repeat', async () => {
    expect(await seedStyles()).toEqual({ families: 6, styles: 24 });
    await db.style.update({ where: { slug: 'ink-wash' }, data: { status: 'LIVE' } });
    await seedStyles();
    expect(await db.style.count()).toBe(24);
    // Re-seeding never changes a style's status.
    expect((await liveStyles()).map((s) => s.slug)).toEqual(['ink-wash']);
  });

  test('sensitivity decides which styles are allowed', async () => {
    const styles = new Map((await db.style.findMany()).map((s) => [s.slug, { slug: s.slug, safety: s.safety as never }]));
    expect(styleAllowed(styles.get('clay-puppet')!, 'NONE')).toBe(true);
    expect(styleAllowed(styles.get('clay-puppet')!, 'ELEVATED')).toBe(false);
    expect(styleAllowed(styles.get('charcoal')!, 'HIGH')).toBe(true);
    expect(styleAllowed(styles.get('oil-impasto')!, 'HIGH')).toBe(false);
    expect(styleAllowed(styles.get('charcoal')!, 'BLOCKED')).toBe(false);
  });

  test('badges say what a style cannot do', () => {
    expect(styleBadges({ safety: { allowsPeople: false, allowsRealPeople: false, allowsSensitive: true, photoreal: true } })).toEqual(['Objects only', 'Good for sensitive stories']);
  });
});

describe('reference choice', () => {
  const ref = (id: string, similarity: number, subject: string, pickCount = 0): RefCandidate => ({ id, url: `u/${id}`, subjects: [subject], similarity, pickCount });

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
});
