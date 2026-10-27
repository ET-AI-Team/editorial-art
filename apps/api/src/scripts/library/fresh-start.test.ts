import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { resetDb } from '../../../test/db';
import { db } from '../../lib/db';
import { seedStyles } from '../../library/styles';
import { freshStart } from './fresh-start';

type RefStatus = 'APPROVED' | 'CANDIDATE' | 'REJECTED' | 'RETIRED';

async function ref(styleId: string, status: RefStatus, n: number, reviewNote: string | null = null) {
  return db.styleReference.create({
    data: {
      styleId,
      source: n % 2 ? 'ARTIST' : 'GENERATED',
      sourceNote: 'test',
      url: `https://res.cloudinary.com/fake/image/upload/v1/fresh/${n}.webp`,
      publicId: `fresh/${n}`,
      width: 1024,
      height: 1024,
      description: 'x',
      subjects: [],
      mood: 'calm',
      status,
      reviewNote,
    },
  });
}

let requestBefore: unknown;
let batchBefore: unknown;

beforeAll(async () => {
  await resetDb();
  await seedStyles();
  // An old style that the seed did not see yet (still LIVE), as if left from an earlier library.
  const family = await db.styleFamily.create({ data: { slug: 'flat-vector', label: 'Flat and vector', sortOrder: 1 } });
  const old = await db.style.create({
    data: { slug: 'editorial-flat', familyId: family.id, label: 'Editorial flat', summary: 'Old style', ruleSheet: {}, goodFor: ['economy'], safety: {}, sortOrder: 1, status: 'LIVE' },
  });
  const ink = await db.style.update({ where: { slug: 'ink-wash' }, data: { status: 'LIVE' } });
  await db.style.update({ where: { slug: 'charcoal' }, data: { status: 'CURATING' } });
  const a = await ref(ink.id, 'APPROVED', 1);
  await ref(ink.id, 'APPROVED', 2, 'kept by the reviewer');
  await ref(ink.id, 'CANDIDATE', 3);
  await ref(ink.id, 'REJECTED', 4);
  await ref(old.id, 'APPROVED', 5);
  await db.style.update({ where: { id: ink.id }, data: { coverReferenceIds: [a.id] } });
  await db.style.update({ where: { id: old.id }, data: { coverReferenceIds: [a.id] } });

  const request = await db.request.create({
    data: {
      publicId: 'ear_freshstarttest00000000',
      callerKeyId: 'k',
      actorUserId: 'u',
      actorWorkspaceId: 'w',
      status: 'HAS_FINAL',
      articleHash: 'h',
      articleChars: 400,
      articleExcerpt: 'x',
      styleId: ink.id,
      pinnedReferenceId: a.id,
      spendCapInr: 100,
      expiresAt: new Date(Date.now() + 86_400_000),
    },
  });
  await db.batch.create({ data: { requestId: request.id, seq: 1, kind: 'INITIAL', styleId: ink.id, directionPlan: {}, status: 'READY', requestedBy: 'u' } });
  requestBefore = await db.request.findUniqueOrThrow({ where: { id: request.id } });
  batchBefore = await db.batch.findFirstOrThrow({ where: { requestId: request.id } });
});

afterAll(() => db.$disconnect());

describe('library:fresh-start', () => {
  test('a dry run counts and changes nothing', async () => {
    const r = await freshStart({ apply: false });
    expect(r).toEqual({ dryRun: true, references: 4, covers: 2, toDraft: ['charcoal', 'ink-wash'], retired: ['editorial-flat'] });
    expect(await db.styleReference.count({ where: { status: { in: ['APPROVED', 'CANDIDATE'] } } })).toBe(4);
    expect((await db.style.findUniqueOrThrow({ where: { slug: 'ink-wash' } })).status).toBe('LIVE');
    expect((await db.style.findUniqueOrThrow({ where: { slug: 'editorial-flat' } })).status).toBe('LIVE');
  });

  test('--apply retires references, clears covers, resets styles and deletes nothing', async () => {
    const counts = { refs: await db.styleReference.count(), styles: await db.style.count(), families: await db.styleFamily.count() };
    const r = await freshStart({ apply: true });
    expect(r.dryRun).toBe(false);
    expect(r.references).toBe(4);

    expect(await db.styleReference.count({ where: { status: { in: ['APPROVED', 'CANDIDATE'] } } })).toBe(0);
    expect(await db.styleReference.count({ where: { status: 'REJECTED' } })).toBe(1);
    expect((await db.styleReference.findFirstOrThrow({ where: { publicId: 'fresh/1' } })).reviewNote).toBe('Retired by library:fresh-start.');
    expect((await db.styleReference.findFirstOrThrow({ where: { publicId: 'fresh/2' } })).reviewNote).toBe('kept by the reviewer');
    expect(await db.style.count({ where: { NOT: { coverReferenceIds: { isEmpty: true } } } })).toBe(0);
    expect((await db.style.findUniqueOrThrow({ where: { slug: 'ink-wash' } })).status).toBe('DRAFT');
    expect((await db.style.findUniqueOrThrow({ where: { slug: 'charcoal' } })).status).toBe('DRAFT');
    const old = await db.style.findUniqueOrThrow({ where: { slug: 'editorial-flat' } });
    expect(old.status).toBe('RETIRED');
    expect(old.retiredAt).not.toBeNull();
    expect(await db.style.count({ where: { status: { in: ['LIVE', 'CURATING'] } } })).toBe(0);

    expect({ refs: await db.styleReference.count(), styles: await db.style.count(), families: await db.styleFamily.count() }).toEqual(counts);
    expect(await db.request.findFirstOrThrow()).toEqual(requestBefore as never);
    expect(await db.batch.findFirstOrThrow()).toEqual(batchBefore as never);
  });

  test('running it again finds nothing to do', async () => {
    expect(await freshStart({ apply: true })).toEqual({ dryRun: false, references: 0, covers: 0, toDraft: [], retired: [] });
  });
});

