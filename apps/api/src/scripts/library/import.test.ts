import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { resetDb } from '../../../test/db';
import { db } from '../../lib/db';
import { seedStyles } from '../../library/styles';
import { setProviders } from '../../providers';
import { createFakeProviders, fakeVector } from '../../providers/fake/fake-providers';
import type { LibraryEntry } from './common';
import { deleteGenerated } from './delete-generated';
import { applyPicks, entryId, importLibrary, pickCovers, type Picks } from './import';

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
  // charcoal and linocut are LIVE on generated references too; charcoal gets too few artist images,
  // linocut is not in the manifest at all.
  for (const slug of ['charcoal', 'linocut']) {
    const other = await db.style.update({ where: { slug }, data: { status: 'LIVE' } });
    await db.styleReference.create({
      data: { styleId: other.id, source: 'GENERATED', sourceNote: 'test', url: `https://res.cloudinary.com/fake/image/upload/v1/gen/${slug}.webp`, publicId: `gen/${slug}`, width: 1024, height: 1024, description: 'x', subjects: [], mood: 'calm', status: 'APPROVED' },
    });
  }
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

    expect(await db.styleReference.count({ where: { styleId: ink.id, source: 'GENERATED', status: { not: 'RETIRED' } } })).toBe(0);
    expect(result.retired).toBe(4);
    expect(result.live).toEqual(['ink-wash']);
    // Below the minimum: imported, but left LIVE on its generated references.
    expect(result.below).toEqual([{ slug: 'charcoal', approved: 6, min: 15 }]);
    expect((await db.style.findUniqueOrThrow({ where: { slug: 'charcoal' } })).status).toBe('LIVE');
    // Not in the manifest: untouched.
    expect((await db.style.findUniqueOrThrow({ where: { slug: 'linocut' } })).status).toBe('LIVE');
    expect(await db.styleReference.count({ where: { source: 'GENERATED', status: 'APPROVED' } })).toBe(2);
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
    expect(await db.styleReference.count({ where: { source: 'GENERATED' } })).toBe(6);
    expect(destroyed).toHaveLength(0);
  });

  test('--apply deletes the rows and their images, and nothing else', async () => {
    const r = await deleteGenerated({ apply: true });
    expect(r).toMatchObject({ dryRun: false, found: 4, deleted: 4, destroyed: 4, failed: 0 });
    expect(await db.styleReference.count({ where: { source: 'GENERATED' } })).toBe(2);
    expect(await db.styleReference.count({ where: { source: 'ARTIST' } })).toBe(24);
    expect(destroyed.sort()).toEqual(['gen/0', 'gen/1', 'gen/2', 'gen/3']);
  });
});

describe('importing hand-picked references', () => {
  const grain = entries('grain-metaphor', 5, 5);
  const wit = entries('minimal-wit', 2, 8);
  const gond = entries('gond', 1, 6);
  const field = entries('colour-field', 4, 4);
  const manifest = [...grain, ...wit, ...gond, ...field];
  // Four of each of the first four artists: 16 kept, the fifth artist left out.
  const keptGrain = grain.filter((e) => !e.artist.slug.endsWith('-4') && Number(e.file.match(/(\d+)\.webp$/)![1]) <= 4);
  const id = (e: LibraryEntry) => entryId(e);
  const picks: Picks = {
    'grain-metaphor': { keep: keptGrain.map(id), covers: [id(keptGrain[13]!), id(keptGrain[0]!), id(keptGrain[6]!).split('/').slice(1).join('/')] },
    'minimal-wit': { keep: wit.slice(0, 15).map(id), covers: [] },
    gond: { keep: gond.slice(0, 5).map(id), covers: [] },
  };

  test('the id of an entry is its file path; the path without the family folder works too', () => {
    expect(id(grain[0]!)).toBe('drawing-sketch/grain-metaphor/grain-metaphor-artist-0/1.webp');
    const picked = applyPicks(manifest, { 'grain-metaphor': { keep: ['grain-metaphor/grain-metaphor-artist-1/2.webp', id(grain[0]!)], covers: [] } });
    expect(picked.get('grain-metaphor')!.entries.map(id)).toEqual(['drawing-sketch/grain-metaphor/grain-metaphor-artist-1/2.webp', id(grain[0]!)]);
  });

  test('every problem in picks.json is reported before anything is written', async () => {
    const before = await db.styleReference.count();
    const bad: Picks = {
      'grain-metaphor': { keep: [id(grain[0]!), 'grain-metaphor/nobody/1.webp'], covers: [id(grain[1]!)] },
      'no-such-style': { keep: ['x.webp'], covers: [] },
      gond: { keep: ['gond/gond-artist-0/1.webp'], covers: [] },
    };
    const notUploaded = manifest.map((e) => (e.style === 'gond' ? { ...e, cloudinaryUrl: undefined, publicId: undefined } : e));
    let message = '';
    try {
      await importLibrary(notUploaded, { picks: bad });
    } catch (error) {
      message = String(error);
    }
    expect(message).toContain('4 problem(s)');
    expect(message).toContain('no entry matches grain-metaphor/nobody/1.webp');
    expect(message).toContain(`cover ${id(grain[1]!)} is not in keep`);
    expect(message).toContain('no-such-style: no entries');
    expect(message).toContain('not uploaded yet');
    expect(await db.styleReference.count()).toBe(before);
  });

  test('only kept entries are imported, covers follow the picks in order, and a style with 15 goes LIVE', async () => {
    const result = await importLibrary(manifest, { picks });
    expect(result.styles.map((r) => r.style).sort()).toEqual(['gond', 'grain-metaphor', 'minimal-wit']);

    const style = await db.style.findUniqueOrThrow({ where: { slug: 'grain-metaphor' } });
    expect(style.status).toBe('LIVE');
    const refs = await db.styleReference.findMany({ where: { styleId: style.id } });
    expect(refs).toHaveLength(16);
    expect(new Set(refs.map((r) => r.publicId))).toEqual(new Set(keptGrain.map((e) => e.publicId!)));
    const byPublicId = new Map(refs.map((r) => [r.publicId, r.id]));
    expect(style.coverReferenceIds).toEqual([keptGrain[13]!, keptGrain[0]!, keptGrain[6]!].map((e) => byPublicId.get(e.publicId!)!));

    // 15 from two artists is enough to go LIVE, with a warning.
    expect((await db.style.findUniqueOrThrow({ where: { slug: 'minimal-wit' } })).status).toBe('LIVE');
    expect(result.fewArtists).toEqual([
      { slug: 'minimal-wit', artists: 2 },
      { slug: 'gond', artists: 1 },
    ]);
    expect(result.below).toEqual([{ slug: 'gond', approved: 5, min: 15 }]);
    expect((await db.style.findUniqueOrThrow({ where: { slug: 'gond' } })).status).toBe('DRAFT');
    // A style in the manifest but not in the picks is not imported.
    const colourField = await db.style.findUniqueOrThrow({ where: { slug: 'colour-field' } });
    expect(await db.styleReference.count({ where: { styleId: colourField.id } })).toBe(0);
  });

  test('a kept image that was retired is approved again rather than added twice', async () => {
    const style = await db.style.findUniqueOrThrow({ where: { slug: 'grain-metaphor' } });
    await db.styleReference.updateMany({ where: { styleId: style.id }, data: { status: 'RETIRED' } });
    await db.style.update({ where: { id: style.id }, data: { status: 'DRAFT', coverReferenceIds: [] } });
    const result = await importLibrary(manifest, { picks: { 'grain-metaphor': picks['grain-metaphor']! } });
    expect(result.styles[0]).toMatchObject({ inserted: 0, reapproved: 16, approved: 16 });
    expect(await db.styleReference.count({ where: { styleId: style.id } })).toBe(16);
    const after = await db.style.findUniqueOrThrow({ where: { id: style.id } });
    expect(after.status).toBe('LIVE');
    expect(after.coverReferenceIds).toHaveLength(3);
    expect(result.fewArtists).toEqual([]);
  });
});
