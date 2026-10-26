/**
 * Screens collected artworks against their style and describes the ones worth keeping.
 *
 *   bun run library:screen -- --dir <collect output dir> [--research <file or dir>] [--max-inr 3000] [--style <slug>]
 *
 * Reads <dir>/collect-manifest.json. Each image gets one vision call (gpt-4.1, the judge model)
 * that scores it against the style's rule sheet and flags writing, logos, signatures, real
 * people (photographed or drawn), licensed characters or brands, explicit content and an
 * AI-generated look. Per artist the best 8 passing images
 * are kept, at most 24 per style; those are described and embedded with the same prompt and
 * model as every other library reference, and written to <dir>/library-manifest.json.
 *
 * Every call goes through the spend guard and the ledger of the database in DATABASE_URL (use
 * the local dev database). The run stops before passing --max-inr. Answers are cached in
 * <dir>/screen-cache.jsonl by file hash, so a re-run only pays for what is new.
 */
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ArtworkScreen, artworkPasses, parseStyleLibrary, RuleSheet, type ReferenceDescription, type RuleSheet as RuleSheetT } from '@editorial-art/shared-types';
import sharp from 'sharp';
import { db } from '../../lib/db';
import { env } from '../../lib/env';
import { ESTIMATE_INR } from '../../lib/pricing';
import { SpendCapError } from '../../lib/spend-guard';
import { describeImage, embedDescription } from '../../library/exemplars';
import { styleLibraryPath } from '../../library/styles';
import { chat } from '../../pipeline/ai';
import type { ImageData } from '../../providers';
import { COLLECT_MANIFEST, LIBRARY_MANIFEST, parseFlags, pool, readJson, readResearch, writeJson, type CollectEntry, type LibraryEntry } from './common';
import { selectKept } from './select';

const SYSTEM = 'You screen artworks by working illustrators for a house-style reference library. Answer only with JSON in the exact shape given. No prose.';

export function artworkScreenPrompt(style: { label: string; ruleSheet: RuleSheetT; photoreal: boolean }): string {
  const rs = style.ruleSheet;
  return `House style: ${style.label}. Medium: ${rs.medium}. Line: ${rs.line}. Texture: ${rs.texture}.
Score how closely this artwork matches the house style's medium, technique, mark-making and texture, and check it for anything that keeps it out of the library.
These are real artists with their own palettes and compositions: do not mark an artwork down for its colours, subject or layout, only for being a different medium or technique.
Return only JSON:
{ "onStyle": number from 0 to 10, "hasReadableText": boolean, "hasLogoOrWatermark": boolean, "hasSignature": boolean,
  "isPhotoOfRealPerson": boolean, "depictsRecognizablePerson": boolean, "hasLicensedCharacterOrBrand": boolean,
  "explicitOrGory": boolean, "isAiGeneratedLooking": boolean, "reason": string }
"onStyle": 10 is a textbook example of this house style, 7 is clearly this style, 4 is a neighbouring style, 0 is unrelated. Judge the look, not the subject.
"hasReadableText": any letters, words, numbers or lettering that can be read, including titles, captions, mastheads and cover type.
"hasLogoOrWatermark": any logo, brand or publication mark, watermark or stamp.
"hasSignature": any signature, initials or monogram of the artist, however small.
"isPhotoOfRealPerson": the image is or contains a photograph of a real person.${style.photoreal ? ' Photographs of objects and places are fine.' : ''} Drawn, painted or modelled figures are not photographs.
"depictsRecognizablePerson": the image shows a real, identifiable person in any medium: a drawn, painted, modelled or caricatured likeness of a politician, actor, athlete, business leader or other public figure. Generic or anonymous figures are not.
"hasLicensedCharacterOrBrand": the image shows a superhero, a cartoon or film character, a brand mascot, a product logo or recognisable branded packaging.
"explicitOrGory": nudity, sexual content, gore, graphic injury or graphic violence.
"isAiGeneratedLooking": the typical artefacts of AI image generation (garbled details, melted hands, smeared texture).
"reason": at most 200 characters.`;
}

// ---- style rule sheets ---------------------------------------------------------------------

interface StyleRules {
  label: string;
  ruleSheet: RuleSheetT;
  photoreal: boolean;
}

/** The database first, then STYLE_LIBRARY.md, then the research seed for a style not seeded yet. */
async function loadRules(slugs: string[], researchPath: string | undefined): Promise<Map<string, StyleRules>> {
  const out = new Map<string, StyleRules>();
  for (const row of await db.style.findMany({ where: { slug: { in: slugs } } })) {
    const rs = RuleSheet.safeParse(row.ruleSheet);
    if (rs.success) out.set(row.slug, { label: row.label, ruleSheet: rs.data, photoreal: Boolean((row.safety as { photoreal?: boolean }).photoreal) });
  }
  try {
    for (const s of parseStyleLibrary(readFileSync(styleLibraryPath(), 'utf8')).styles) {
      if (!out.has(s.slug)) out.set(s.slug, { label: s.label, ruleSheet: s.ruleSheet, photoreal: s.safety.photoreal });
    }
  } catch {
    // An older STYLE_LIBRARY.md that does not parse: the research seeds cover the rest.
  }
  if (researchPath) {
    for (const e of readResearch(researchPath)) {
      if (out.has(e.style.slug)) continue;
      const seed = e.style.seed as { label?: string; ruleSheet?: unknown; safety?: { photoreal?: boolean } } | undefined;
      const rs = RuleSheet.safeParse(seed?.ruleSheet);
      if (rs.success) out.set(e.style.slug, { label: seed?.label ?? e.style.slug, ruleSheet: rs.data, photoreal: Boolean(seed?.safety?.photoreal) });
    }
  }
  return out;
}

// ---- cache ---------------------------------------------------------------------------------

interface CacheRow {
  screen?: ArtworkScreen;
  described?: ReferenceDescription;
  embedding?: number[];
  embeddingModel?: string;
}

function loadCache(path: string): Map<string, CacheRow> {
  const cache = new Map<string, CacheRow>();
  if (!existsSync(path)) return cache;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const { hash, ...row } = JSON.parse(line) as CacheRow & { hash: string };
      cache.set(hash, { ...cache.get(hash), ...row });
    } catch {
      // A line cut short by an interrupted run.
    }
  }
  return cache;
}

// ---- main ----------------------------------------------------------------------------------

async function forModel(file: string): Promise<ImageData> {
  const buffer = await sharp(file).resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  return { buffer, mimeType: 'image/webp' };
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2), { dir: 'string', research: 'string', 'max-inr': 'string', style: 'string', concurrency: 'string' });
  if (!flags.dir) throw new Error('Pass --dir <collect output directory>.');
  const dir = String(flags.dir);
  const maxInr = Number(flags['max-inr'] ?? 3000);
  if (!Number.isFinite(maxInr) || maxInr <= 0) throw new Error('--max-inr must be a positive number.');
  const concurrency = Math.max(1, Math.min(12, Number(flags.concurrency ?? 6) || 6));

  const collected = readJson<CollectEntry[]>(join(dir, COLLECT_MANIFEST), []).filter((e) => !flags.style || e.style === flags.style);
  if (!collected.length) throw new Error(`No images in ${join(dir, COLLECT_MANIFEST)}${flags.style ? ` for ${flags.style}` : ''}.`);
  const styles = [...new Set(collected.map((e) => e.style))];
  const rules = await loadRules(styles, flags.research ? String(flags.research) : undefined);
  const missing = styles.filter((s) => !rules.has(s));
  if (missing.length) console.warn(`No rule sheet for ${missing.join(', ')}: their images are skipped. Pass --research or seed the styles.`);

  const cachePath = join(dir, 'screen-cache.jsonl');
  const cache = loadCache(cachePath);
  const remember = (hash: string, row: CacheRow) => {
    cache.set(hash, { ...cache.get(hash), ...row });
    appendFileSync(cachePath, `${JSON.stringify({ hash, ...row })}\n`);
  };

  const startedAt = new Date();
  const spent = async () => Number((await db.attempt.aggregate({ _sum: { costInr: true }, where: { startedAt: { gte: startedAt } } }))._sum.costInr ?? 0);
  let stopped: string | null = null;
  const guard = async (estimate: number) => {
    if (stopped) return false;
    if ((await spent()) + estimate > maxInr) stopped = `the --max-inr cap of Rs ${maxInr} for this run`;
    return !stopped;
  };
  const onError = (label: string, error: unknown) => {
    if (error instanceof SpendCapError) stopped = error.message;
    else console.error(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  };

  // 1. Screen every image once.
  const hashes = new Map<string, string>();
  const screenEstimate = ESTIMATE_INR.judge;
  await pool(
    collected.filter((e) => rules.has(e.style)),
    concurrency,
    async (entry) => {
      const path = join(dir, entry.file);
      if (!existsSync(path)) return;
      const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
      hashes.set(entry.file, hash);
      if (ArtworkScreen.safeParse(cache.get(hash)?.screen).success) return;
      if (!(await guard(screenEstimate))) return;
      try {
        const style = rules.get(entry.style)!;
        const verdict = await chat(
          { stage: 'screen_artwork' },
          { kind: 'screen_artwork', model: env().EA_JUDGE_MODEL, system: SYSTEM, user: artworkScreenPrompt(style), images: [await forModel(path)], imageDetail: 'high', temperature: 0 },
          ArtworkScreen,
          screenEstimate
        );
        remember(hash, { screen: verdict });
      } catch (error) {
        onError(entry.file, error);
      }
    },
    () => stopped !== null
  );

  // 2. Keep the best per artist and per style, then describe and embed only those.
  const screened = collected
    .filter((e) => hashes.has(e.file) && ArtworkScreen.safeParse(cache.get(hashes.get(e.file)!)?.screen).success)
    .map((e) => ({ ...e, screen: cache.get(hashes.get(e.file)!)!.screen!, onStyle: cache.get(hashes.get(e.file)!)!.screen!.onStyle }));
  const kept = styles.flatMap((slug) => selectKept(screened.filter((e) => e.style === slug && artworkPasses(e.screen))));
  const describeEstimate = ESTIMATE_INR.text + ESTIMATE_INR.embed;
  await pool(
    kept,
    concurrency,
    async (entry) => {
      const hash = hashes.get(entry.file)!;
      const row = cache.get(hash) ?? {};
      try {
        if (!row.described) {
          if (!(await guard(describeEstimate))) return;
          remember(hash, { described: await describeImage(await forModel(join(dir, entry.file))) });
        }
        if (!cache.get(hash)?.embedding) {
          const embedded = await embedDescription(cache.get(hash)!.described!.description);
          remember(hash, { embedding: embedded.vector, embeddingModel: embedded.model });
        }
      } catch (error) {
        onError(entry.file, error);
      }
    },
    () => stopped !== null
  );

  // 3. The library manifest, keeping what an earlier upload wrote.
  const manifestPath = join(dir, LIBRARY_MANIFEST);
  const uploaded = new Map(readJson<LibraryEntry[]>(manifestPath, []).map((e) => [e.file, e]));
  const library: LibraryEntry[] = [];
  for (const entry of kept) {
    const row = cache.get(hashes.get(entry.file)!);
    if (!row?.described || !row.embedding) continue;
    const before = uploaded.get(entry.file);
    library.push({
      family: entry.family,
      style: entry.style,
      artist: entry.artist,
      sourceUrl: entry.sourceUrl,
      imageUrl: entry.imageUrl,
      file: entry.file,
      width: entry.width,
      height: entry.height,
      onStyle: entry.onStyle,
      description: row.described.description,
      subjects: row.described.subjects,
      mood: row.described.mood,
      embedding: row.embedding,
      embeddingModel: row.embeddingModel ?? env().EA_EMBED_MODEL,
      ...(before?.cloudinaryUrl ? { cloudinaryUrl: before.cloudinaryUrl, publicId: before.publicId, width: before.width, height: before.height } : {}),
    });
  }
  // Styles not screened in this run (--style) keep their rows.
  for (const e of uploaded.values()) if (flags.style && e.style !== flags.style) library.push(e);
  writeJson(manifestPath, library);

  console.log('\nstyle                      images  screened  passed  kept  artists');
  for (const slug of styles) {
    const all = collected.filter((e) => e.style === slug);
    const s = screened.filter((e) => e.style === slug);
    const k = library.filter((e) => e.style === slug);
    const artists = new Set(k.map((e) => e.artist.slug)).size;
    console.log(
      `${slug.padEnd(26)} ${String(all.length).padStart(6)} ${String(s.length).padStart(9)} ${String(s.filter((e) => artworkPasses(e.screen)).length).padStart(7)} ${String(k.length).padStart(5)} ${String(artists).padStart(8)}`
    );
  }
  console.log(`\nWrote ${library.length} images to ${manifestPath}. Spent Rs ${(await spent()).toFixed(2)} on this run.`);
  if (stopped) {
    console.error(`Stopped early: ${stopped}. Run again to continue; finished work is cached.`);
    process.exitCode = 1;
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
