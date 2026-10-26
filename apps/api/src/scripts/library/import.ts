/**
 * Loads the uploaded artist library into the database. No admin review: everything screened in is
 * approved.
 *
 *   bun run library:import -- --dir <collect output dir> [--style <slug>]
 *
 * Reads <dir>/library-manifest.json (after library:upload). For each style, in one transaction:
 * upserts the artists by slug, inserts each artwork as an APPROVED reference with source ARTIST
 * (skipping public ids already present, so a re-run is safe), stores its embedding, and sets the
 * covers to the three best artworks by three different artists. Then every GENERATED reference
 * is retired and dropped from covers, and each style is LIVE exactly when it has at least its
 * minimum of approved references (15); styles below it are listed and not offered to editors.
 */
import { join } from 'node:path';
import { db } from '../../lib/db';
import { vectorLiteral } from '../../library/references';
import { LIBRARY_MANIFEST, parseFlags, readJson, type LibraryEntry } from './common';

export interface StyleImportResult {
  style: string;
  inserted: number;
  skipped: number;
  approved: number;
  artists: number;
  status: string;
}

/** The three best artworks by three different artists, then the next best if there are fewer artists. */
export function pickCovers(entries: Pick<LibraryEntry, 'publicId' | 'onStyle' | 'artist'>[]): string[] {
  const sorted = [...entries].filter((e) => e.publicId).sort((a, b) => b.onStyle - a.onStyle);
  const covers: string[] = [];
  const artists = new Set<string>();
  for (const e of sorted) {
    if (covers.length === 3) break;
    if (artists.has(e.artist.slug)) continue;
    artists.add(e.artist.slug);
    covers.push(e.publicId!);
  }
  for (const e of sorted) {
    if (covers.length === 3) break;
    if (!covers.includes(e.publicId!)) covers.push(e.publicId!);
  }
  return covers;
}

async function importStyle(slug: string, entries: LibraryEntry[]): Promise<StyleImportResult | null> {
  if (entries.some((e) => e.embedding.length !== 1536)) throw new Error(`${slug}: an embedding is not 1536 numbers. Re-run library:screen.`);
  const style = await db.style.findUnique({ where: { slug }, select: { id: true } });
  if (!style) {
    console.warn(`${slug}: no such style in the database. Run seed:styles first. Skipped.`);
    return null;
  }
  return db.$transaction(
    async (tx) => {
      const artistIds = new Map<string, string>();
      for (const e of entries) {
        if (artistIds.has(e.artist.slug)) continue;
        const artist = await tx.artist.upsert({
          where: { slug: e.artist.slug },
          create: { slug: e.artist.slug, name: e.artist.name, portfolioUrl: e.artist.portfolioUrl },
          update: { name: e.artist.name, portfolioUrl: e.artist.portfolioUrl },
        });
        artistIds.set(e.artist.slug, artist.id);
      }

      const existing = new Set(
        (await tx.styleReference.findMany({ where: { publicId: { in: entries.map((e) => e.publicId!) } }, select: { publicId: true } })).map((r) => r.publicId)
      );
      let inserted = 0;
      for (const e of entries) {
        if (existing.has(e.publicId!)) continue;
        const ref = await tx.styleReference.create({
          data: {
            styleId: style.id,
            source: 'ARTIST',
            sourceNote: `${e.artist.name}, ${e.sourceUrl}`,
            sourceUrl: e.sourceUrl,
            artistId: artistIds.get(e.artist.slug)!,
            url: e.cloudinaryUrl!,
            publicId: e.publicId!,
            width: e.width,
            height: e.height,
            description: e.description,
            subjects: e.subjects,
            mood: e.mood,
            screen: { passed: true, reason: `Artist library screen: on style ${e.onStyle} of 10.` },
            status: 'APPROVED',
            reviewedBy: 'library:import',
            reviewedAt: new Date(),
          },
          select: { id: true },
        });
        await tx.$executeRaw`UPDATE "StyleReference" SET embedding = ${vectorLiteral(e.embedding)}::vector, "embeddingModel" = ${e.embeddingModel} WHERE id = ${ref.id}`;
        inserted++;
      }

      const byPublicId = new Map(
        (await tx.styleReference.findMany({ where: { styleId: style.id, source: 'ARTIST', status: 'APPROVED' }, select: { id: true, publicId: true } })).map((r) => [r.publicId, r.id])
      );
      const covers = pickCovers(entries.filter((e) => byPublicId.has(e.publicId!)))
        .map((p) => byPublicId.get(p)!)
        .filter(Boolean);
      if (covers.length) await tx.style.update({ where: { id: style.id }, data: { coverReferenceIds: covers } });

      return { style: slug, inserted, skipped: entries.length - inserted, approved: byPublicId.size, artists: artistIds.size, status: '' };
    },
    { timeout: 120_000, maxWait: 30_000 }
  );
}

/** Retires every GENERATED reference (of the given styles, or all) and takes it out of covers. */
export async function retireGenerated(styleIds?: string[]): Promise<number> {
  const scope = styleIds ? { styleId: { in: styleIds } } : {};
  const retired = await db.styleReference.updateMany({ where: { ...scope, source: 'GENERATED', status: { not: 'RETIRED' } }, data: { status: 'RETIRED', reviewNote: 'Replaced by the artist library.' } });
  const generated = new Set((await db.styleReference.findMany({ where: { ...scope, source: 'GENERATED' }, select: { id: true } })).map((r) => r.id));
  for (const style of await db.style.findMany({ where: styleIds ? { id: { in: styleIds } } : {}, select: { id: true, coverReferenceIds: true } })) {
    const kept = style.coverReferenceIds.filter((id) => !generated.has(id));
    if (kept.length !== style.coverReferenceIds.length) await db.style.update({ where: { id: style.id }, data: { coverReferenceIds: kept } });
  }
  return retired.count;
}

/** LIVE exactly when a style has its minimum of approved references; otherwise not offered. */
export async function settleStatuses(styleIds?: string[]): Promise<{ live: string[]; below: { slug: string; approved: number; min: number }[] }> {
  const counts = new Map(
    (await db.styleReference.groupBy({ by: ['styleId'], where: { status: 'APPROVED' }, _count: { _all: true } })).map((g) => [g.styleId, g._count._all])
  );
  const live: string[] = [];
  const below: { slug: string; approved: number; min: number }[] = [];
  for (const style of await db.style.findMany({ where: { status: { not: 'RETIRED' }, ...(styleIds ? { id: { in: styleIds } } : {}) }, orderBy: { sortOrder: 'asc' } })) {
    const approved = counts.get(style.id) ?? 0;
    if (approved >= style.minApprovedRefs) {
      live.push(style.slug);
      if (style.status !== 'LIVE') await db.style.update({ where: { id: style.id }, data: { status: 'LIVE' } });
    } else {
      below.push({ slug: style.slug, approved, min: style.minApprovedRefs });
      if (style.status === 'LIVE') await db.style.update({ where: { id: style.id }, data: { status: 'CURATING' } });
    }
  }
  return { live, below };
}

export async function importLibrary(manifest: LibraryEntry[], opts: { style?: string } = {}): Promise<{ styles: StyleImportResult[]; retired: number; live: string[]; below: { slug: string; approved: number; min: number }[] }> {
  const ready = manifest.filter((e) => e.cloudinaryUrl && e.publicId && (!opts.style || e.style === opts.style));
  const missing = manifest.filter((e) => !e.cloudinaryUrl || !e.publicId).length;
  if (missing) console.warn(`${missing} manifest entries have no Cloudinary URL yet and are skipped. Run library:upload first.`);
  const results: StyleImportResult[] = [];
  for (const slug of [...new Set(ready.map((e) => e.style))]) {
    const result = await importStyle(
      slug,
      ready.filter((e) => e.style === slug)
    );
    if (result) console.log(`  ${slug}: ${result.inserted} new, ${result.approved} approved from ${result.artists} artists`);
    if (result) results.push(result);
  }
  // A run limited to one style only touches that style; a full run settles the whole library.
  const scope = opts.style ? (await db.style.findMany({ where: { slug: opts.style }, select: { id: true } })).map((s) => s.id) : undefined;
  const retired = await retireGenerated(scope);
  const { live, below } = await settleStatuses(scope);
  for (const r of results) r.status = live.includes(r.style) ? 'LIVE' : 'below minimum';
  return { styles: results, retired, live, below };
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2), { dir: 'string', style: 'string' });
  if (!flags.dir) throw new Error('Pass --dir <collect output directory>.');
  const manifestPath = join(String(flags.dir), LIBRARY_MANIFEST);
  const manifest = readJson<LibraryEntry[]>(manifestPath, []);
  if (!manifest.length) throw new Error(`No entries in ${manifestPath}.`);

  const result = await importLibrary(manifest, { style: flags.style ? String(flags.style) : undefined });
  console.log('\nstyle                      inserted  skipped  approved  artists  status');
  for (const r of result.styles) {
    console.log(`${r.style.padEnd(26)} ${String(r.inserted).padStart(8)} ${String(r.skipped).padStart(8)} ${String(r.approved).padStart(9)} ${String(r.artists).padStart(8)}  ${r.status}`);
  }
  console.log(`\nRetired ${result.retired} generated references. ${result.live.length} styles are LIVE.`);
  if (result.below.length) {
    console.log(`Below the minimum, not offered to editors (${result.below.length}):`);
    for (const b of result.below) console.log(`  ${b.slug.padEnd(26)} ${b.approved} of ${b.min}`);
  }
}

if (import.meta.main) {
  main()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
