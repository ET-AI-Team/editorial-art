/**
 * Loads the uploaded artist library into the database.
 *
 *   bun run library:import -- --dir <collect output dir> [--style <slug>]
 *   bun run library:import -- --dir <collect output dir> --picks picks.json [--style <slug>]
 *
 * Without --picks there is no review: everything screened in is approved, as described next.
 *
 * Reads <dir>/library-manifest.json (after library:upload). For each style, in one transaction:
 * upserts the artists by slug, inserts each artwork as an APPROVED reference with source ARTIST
 * (skipping public ids already present, so a re-run is safe), stores its embedding, and sets the
 * covers to the three best artworks by three different artists. Then each imported style with at
 * least its minimum of approved artist references (15) has its GENERATED references retired and
 * dropped from covers and goes LIVE. A style below the minimum is listed and left as it was.
 * Only styles in the manifest are touched, so the library can go live one family at a time.
 *
 * With --picks, a person has chosen by hand. picks.json is
 *
 *   { "<style-slug>": { "keep": ["<id>", ...], "covers": ["<id>", ...] }, ... }
 *
 * where an id is the entry's `file` in library-manifest.json, the image's path relative to the
 * collect output directory: `<family>/<style>/<artist-slug>/<n>.webp`, for example
 * `conceptual-flat/grain-metaphor/some-artist/3.webp`. It is stable across re-runs of screen and
 * upload, and it is the path of the image on disk, so it is what a person looking at the files
 * copies. The same path without its first (family) folder, `grain-metaphor/some-artist/3.webp`,
 * is accepted too. Only the styles in picks.json are imported, and of each only the kept
 * entries: a kept entry already in the database for this style (a retired one, say, after
 * library:fresh-start) is approved again. The covers are the `covers` ids in that order (at most
 * three, each also kept); with none given they are chosen as above. A style goes LIVE once it has
 * its minimum of approved ARTIST references (15); a warning is printed for a style with
 * approved references from fewer than four artists. An unknown style or id, or a kept entry
 * that is not uploaded yet, stops the run before anything is written.
 */
import { join } from 'node:path';
import { z } from 'zod';
import { db } from '../../lib/db';
import { vectorLiteral } from '../../library/references';
import { LIBRARY_MANIFEST, parseFlags, readJson, type LibraryEntry } from './common';

export interface StyleImportResult {
  style: string;
  inserted: number;
  skipped: number;
  /** Kept entries already in the database but not approved, approved again (--picks only). */
  reapproved: number;
  approved: number;
  artists: number;
  status: string;
}

// ---- picks ---------------------------------------------------------------------------------

export const Picks = z.record(
  z.string().min(1),
  z.object({ keep: z.array(z.string().min(1)).min(1), covers: z.array(z.string().min(1)).max(3).default([]) }).strict()
);
export type Picks = z.infer<typeof Picks>;

/** The id of a manifest entry in picks.json: its file path relative to the collect directory. */
export function entryId(e: Pick<LibraryEntry, 'file'>): string {
  return e.file.replace(/\\/g, '/');
}

function matches(e: Pick<LibraryEntry, 'file'>, id: string): boolean {
  const file = entryId(e);
  const clean = id.replace(/\\/g, '/').replace(/^\.\//, '');
  return file === clean || file.slice(file.indexOf('/') + 1) === clean;
}

export interface PickedStyle {
  entries: LibraryEntry[];
  /** Public ids of the covers, in order; empty to choose them automatically. */
  covers: string[];
}

/**
 * The kept entries and covers of each style in picks.json. Every problem (an unknown style or
 * id, a cover that is not kept, a kept entry not uploaded yet) is reported at once, before
 * anything is written.
 */
export function applyPicks(manifest: LibraryEntry[], picks: Picks): Map<string, PickedStyle> {
  const problems: string[] = [];
  const out = new Map<string, PickedStyle>();
  for (const [style, pick] of Object.entries(picks)) {
    const own = manifest.filter((e) => e.style === style);
    if (!own.length) {
      problems.push(`${style}: no entries for this style in the manifest`);
      continue;
    }
    const find = (id: string) => {
      const found = own.filter((e) => matches(e, id));
      if (found.length !== 1) problems.push(`${style}: ${found.length ? 'more than one entry matches' : 'no entry matches'} ${id}`);
      return found.length === 1 ? found[0]! : null;
    };
    const entries: LibraryEntry[] = [];
    for (const id of new Set(pick.keep)) {
      const e = find(id);
      if (!e) continue;
      if (!e.cloudinaryUrl || !e.publicId) problems.push(`${style}: ${id} is kept but not uploaded yet; run library:upload first`);
      else if (!entries.includes(e)) entries.push(e);
    }
    const covers: string[] = [];
    for (const id of pick.covers) {
      const e = find(id);
      if (!e) continue;
      if (!pick.keep.some((k) => matches(e, k))) problems.push(`${style}: cover ${id} is not in keep`);
      else if (e.publicId && !covers.includes(e.publicId)) covers.push(e.publicId);
    }
    out.set(style, { entries, covers });
  }
  if (problems.length) throw new Error(`picks.json has ${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
  return out;
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

async function importStyle(slug: string, entries: LibraryEntry[], picked?: { covers: string[] }): Promise<StyleImportResult | null> {
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

      const found = await tx.styleReference.findMany({ where: { publicId: { in: entries.map((e) => e.publicId!) } }, select: { id: true, publicId: true, styleId: true, status: true, source: true } });
      const existing = new Set(found.map((r) => r.publicId));
      // Picked by hand: a kept image already here for this style but not approved (retired by a
      // fresh start, say) is approved again.
      const again = picked ? found.filter((r) => r.styleId === style.id && r.source === 'ARTIST' && r.status !== 'APPROVED').map((r) => r.id) : [];
      if (again.length) {
        await tx.styleReference.updateMany({ where: { id: { in: again } }, data: { status: 'APPROVED', reviewedBy: 'library:import --picks', reviewedAt: new Date() } });
      }
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
      const coverIds = picked?.covers.length ? picked.covers : pickCovers(entries.filter((e) => byPublicId.has(e.publicId!)));
      const covers = coverIds.map((p) => byPublicId.get(p)!).filter(Boolean);
      if (covers.length) await tx.style.update({ where: { id: style.id }, data: { coverReferenceIds: covers } });

      return { style: slug, inserted, skipped: entries.length - inserted, reapproved: again.length, approved: byPublicId.size, artists: artistIds.size, status: '' };
    },
    { timeout: 120_000, maxWait: 30_000 }
  );
}

/** Retires every GENERATED reference of the given styles and takes it out of their covers. */
export async function retireGenerated(styleIds: string[]): Promise<number> {
  if (!styleIds.length) return 0;
  const scope = { styleId: { in: styleIds } };
  const retired = await db.styleReference.updateMany({ where: { ...scope, source: 'GENERATED', status: { not: 'RETIRED' } }, data: { status: 'RETIRED', reviewNote: 'Replaced by the artist library.' } });
  const generated = new Set((await db.styleReference.findMany({ where: { ...scope, source: 'GENERATED' }, select: { id: true } })).map((r) => r.id));
  for (const style of await db.style.findMany({ where: { id: { in: styleIds } }, select: { id: true, coverReferenceIds: true } })) {
    const kept = style.coverReferenceIds.filter((id) => !generated.has(id));
    if (kept.length !== style.coverReferenceIds.length) await db.style.update({ where: { id: style.id }, data: { coverReferenceIds: kept } });
  }
  return retired.count;
}

export interface Settled {
  live: string[];
  below: { slug: string; approved: number; min: number }[];
  retired: number;
}

/**
 * For each given style: with at least its minimum of approved artist references (with
 * `artistOnly`, ARTIST ones only; otherwise any source but GENERATED), its generated
 * references are retired and it goes LIVE. Below the minimum nothing about it changes (it keeps
 * its status and any generated references), so importing part of the library never takes a
 * style away from editors.
 */
export async function settleStyles(styleIds: string[], opts: { artistOnly?: boolean } = {}): Promise<Settled> {
  const source = opts.artistOnly ? ('ARTIST' as const) : { not: 'GENERATED' as const };
  const counts = new Map(
    (await db.styleReference.groupBy({ by: ['styleId'], where: { styleId: { in: styleIds }, status: 'APPROVED', source }, _count: { _all: true } })).map((g) => [
      g.styleId,
      g._count._all,
    ])
  );
  const out: Settled = { live: [], below: [], retired: 0 };
  const ready: string[] = [];
  for (const style of await db.style.findMany({ where: { id: { in: styleIds }, status: { not: 'RETIRED' } }, orderBy: { sortOrder: 'asc' } })) {
    const approved = counts.get(style.id) ?? 0;
    if (approved >= style.minApprovedRefs) {
      ready.push(style.id);
      out.live.push(style.slug);
    } else {
      out.below.push({ slug: style.slug, approved, min: style.minApprovedRefs });
    }
  }
  out.retired = await retireGenerated(ready);
  if (ready.length) await db.style.updateMany({ where: { id: { in: ready } }, data: { status: 'LIVE' } });
  return out;
}

export const MIN_ARTISTS = 4;

/**
 * Imports the styles in the manifest (or one of them) and touches no other style. With picks,
 * only the styles in them, and of those only the kept entries.
 */
export async function importLibrary(
  manifest: LibraryEntry[],
  opts: { style?: string; picks?: Picks } = {}
): Promise<{ styles: StyleImportResult[]; fewArtists: { slug: string; artists: number }[] } & Settled> {
  const picked = opts.picks ? applyPicks(manifest, opts.picks) : null;
  const wanted = (slug: string) => !opts.style || slug === opts.style;
  const work: { slug: string; entries: LibraryEntry[]; picked?: PickedStyle }[] = [];
  if (picked) {
    for (const [slug, p] of picked) if (wanted(slug)) work.push({ slug, entries: p.entries, picked: p });
  } else {
    const ready = manifest.filter((e) => e.cloudinaryUrl && e.publicId && wanted(e.style));
    const missing = manifest.filter((e) => !e.cloudinaryUrl || !e.publicId).length;
    if (missing) console.warn(`${missing} manifest entries have no Cloudinary URL yet and are skipped. Run library:upload first.`);
    for (const slug of [...new Set(ready.map((e) => e.style))]) work.push({ slug, entries: ready.filter((e) => e.style === slug) });
  }
  const results: StyleImportResult[] = [];
  for (const w of work) {
    const result = await importStyle(w.slug, w.entries, w.picked);
    if (result) console.log(`  ${w.slug}: ${result.inserted} new${result.reapproved ? `, ${result.reapproved} approved again` : ''}, ${result.approved} approved from ${result.artists} artists`);
    if (result) results.push(result);
  }
  const rows = await db.style.findMany({ where: { slug: { in: results.map((r) => r.style) } }, select: { id: true, slug: true }, orderBy: { sortOrder: 'asc' } });
  const settled = await settleStyles(rows.map((s) => s.id), { artistOnly: !!picked });
  for (const r of results) r.status = settled.live.includes(r.style) ? 'LIVE' : 'below minimum, unchanged';

  const fewArtists: { slug: string; artists: number }[] = [];
  if (picked && rows.length) {
    const groups = await db.styleReference.groupBy({ by: ['styleId', 'artistId'], where: { styleId: { in: rows.map((s) => s.id) }, status: 'APPROVED', source: 'ARTIST' } });
    for (const style of rows) {
      const artists = new Set(groups.filter((g) => g.styleId === style.id && g.artistId).map((g) => g.artistId)).size;
      if (artists < MIN_ARTISTS) fewArtists.push({ slug: style.slug, artists });
    }
  }
  return { styles: results, fewArtists, ...settled };
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2), { dir: 'string', style: 'string', picks: 'string' });
  if (!flags.dir) throw new Error('Pass --dir <collect output directory>.');
  const manifestPath = join(String(flags.dir), LIBRARY_MANIFEST);
  const manifest = readJson<LibraryEntry[]>(manifestPath, []);
  if (!manifest.length) throw new Error(`No entries in ${manifestPath}.`);

  let picks: Picks | undefined;
  if (flags.picks) {
    const raw = readJson<unknown>(String(flags.picks), null);
    if (raw === null) throw new Error(`No picks file at ${String(flags.picks)}.`);
    picks = Picks.parse(raw);
  }

  const result = await importLibrary(manifest, { style: flags.style ? String(flags.style) : undefined, picks });
  console.log('\nstyle                      inserted  skipped  approved  artists  status');
  for (const r of result.styles) {
    console.log(`${r.style.padEnd(26)} ${String(r.inserted).padStart(8)} ${String(r.skipped).padStart(8)} ${String(r.approved).padStart(9)} ${String(r.artists).padStart(8)}  ${r.status}`);
  }
  for (const f of result.fewArtists) console.warn(`Warning: ${f.slug} has approved references from only ${f.artists} artists (aim for at least ${MIN_ARTISTS}).`);
  console.log(`\nRetired ${result.retired} generated references. ${result.live.length} imported styles are LIVE.`);
  if (result.below.length) {
    console.log(`Below the minimum, left unchanged (${result.below.length}):`);
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
