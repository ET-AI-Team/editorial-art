import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { resetDb } from '../../../test/db';
import { db } from '../../lib/db';
import { seedStyles } from '../../library/styles';
import { setProviders } from '../../providers';
import { createFakeProviders, fakeVector } from '../../providers/fake/fake-providers';
import type { LibraryEntry } from './common';
import { deleteGenerated } from './delete-generated';
import { importLibrary, pickCovers } from './import';

const destroyed: string[] = [];

function entries(style: string, artists: number, perArtist: number): LibraryEntry[] {
  return Array.from({ length: artists * perArtist }, (_, i) => {
    const a = Math.floor(i / perArtist);
    const n = (i % perArtist) + 1;
    const slug = `${style}-artist-${a}`;
    const publicId = `test/library/${style}/${slug}/${n}`;
    return {
      family: 'drawing-sketch',
      style,
      artist: { name: `Artist ${a} of ${style}`, slug, portfolioUrl: `https://example.com/${slug}` },
      sourceUrl: `https://example.com/${slug}/project`,
      imageUrl: `https://cdn.example.com/${slug}/${n}.jpg`,
      file: `drawing-sketch/${style}/${slug}/${n}.webp`,
      width: 1600,
      height: 1200,
      onStyle: 10 - a - n / 100,
      description: `Artwork ${n} by artist ${a}: a quiet harbour at dusk with one boat and a long reflection.`,
      subjects: ['water'],
      mood: 'calm',
      embedding: fakeVector(`harbour ${style} ${a} ${n}`),
      embeddingModel: 'text-embedding-3-small',
      cloudinaryUrl: `https://res.cloudinary.com/fake/image/upload/v1/${publicId}.webp`,
      publicId,
    };
  });
}

beforeAll(async () => {
  await resetDb();
  await seedStyles();
  const fake = createFakeProviders();
  setProviders({
    ...fake,
    destroy: async (publicId) => {
      destroyed.push(publicId);
    },
  });
  // ink-wash starts LIVE on four generated references, one of them a cover.
  const style = await db.style.update({ where: { slug: 'ink-wash' }, data: { status: 'LIVE' } });
  const ids: string[] = [];
  for (let i = 0; i < 4; i++) {
    const r = await db.styleReference.create({
      data: { styleId: style.id, source: 'GENERATED', sourceNote: 'test', url: `https://res.cloudinary.com/fake/image/upload/v1/gen/${i}.webp`, publicId: `gen/${i}`, width: 1024, height: 1024, description: 'x', subjects: [], mood: 'calm', status: 'APPROVED' },
    });
    ids.push(r.id);
  }
  await db.style.update({ where: { id: style.id }, data: { coverReferenceIds: [ids[0]!] } });
});

afterAll(async () => {
  setProviders(undefined);
  await db.$disconnect();
});

describe('importing the artist library', () => {
  test('covers are the best works of three different artists', () => {
    const covers = pickCovers(entries('x', 4, 3));
    expect(covers).toEqual(['test/library/x/x-artist-0/1', 'test/library/x/x-artist-1/1', 'test/library/x/x-artist-2/1']);
    expect(pickCovers(entries('y', 1, 5))).toHaveLength(3);
  });

  test('loads approved artist references, sets covers and status, and retires generated ones', async () => {
    const manifest = [...entries('ink-wash', 3, 6), ...entries('charcoal', 2, 3), { ...entries('linocut', 1, 1)[0]!, cloudinaryUrl: undefined, publicId: undefined }];
    const result = await importLibrary(manifest);

    const ink = await db.style.findUniqueOrThrow({ where: { slug: 'ink-wash' } });
    expect(ink.status).toBe('LIVE');
    const refs = await db.styleReference.findMany({ where: { styleId: ink.id, source: 'ARTIST' }, include: { artist: true } });
    expect(refs).toHaveLength(18);
    expect(refs.every((r) => r.status === 'APPROVED' && r.artist && r.sourceUrl === `https://example.com/${r.artist.slug}/project`)).toBe(true);
    expect(refs[0]!.sourceNote).toBe(`${refs[0]!.artist!.name}, ${refs[0]!.sourceUrl}`);
    const embedded = await db.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM "StyleReference" WHERE "styleId" = ${ink.id} AND source = 'ARTIST' AND embedding IS NOT NULL`;
    expect(Number(embedded[0]!.n)).toBe(18);

    expect(ink.coverReferenceIds).toHaveLength(3);
    const coverArtists = refs.filter((r) => ink.coverReferenceIds.includes(r.id)).map((r) => r.artistId);
    expect(new Set(coverArtists).size).toBe(3);

    expect(await db.styleReference.count({ where: { source: 'GENERATED', status: { not: 'RETIRED' } } })).toBe(0);
    expect(result.retired).toBe(4);
    expect(result.below.map((b) => b.slug)).toContain('charcoal');
    expect((await db.style.findUniqueOrThrow({ where: { slug: 'charcoal' } })).status).not.toBe('LIVE');
    expect(await db.artist.count()).toBe(5);
  });

  test('running it again adds nothing', async () => {
    const result = await importLibrary(entries('ink-wash', 3, 6));
    expect(result.styles[0]).toMatchObject({ style: 'ink-wash', inserted: 0, skipped: 18, approved: 18 });
    expect(await db.styleReference.count({ where: { source: 'ARTIST' } })).toBe(24);
  });
});

describe('deleting retired generated references', () => {
  test('a dry run only counts', async () => {
    const r = await deleteGenerated({ apply: false });
    expect(r).toMatchObject({ dryRun: true, found: 4, deleted: 0 });
    expect(destroyed).toHaveLength(0);
    expect(await db.styleReference.count({ where: { source: 'GENERATED' } })).toBe(4);
  });

  test('--apply deletes the rows and their images, and nothing else', async () => {
    const r = await deleteGenerated({ apply: true });
    expect(r).toMatchObject({ dryRun: false, found: 4, deleted: 4, destroyed: 4, failed: 0 });
    expect(await db.styleReference.count({ where: { source: 'GENERATED' } })).toBe(0);
    expect(await db.styleReference.count({ where: { source: 'ARTIST' } })).toBe(24);
    expect(destroyed.sort()).toEqual(['gen/0', 'gen/1', 'gen/2', 'gen/3']);
  });
});
