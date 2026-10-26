import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { z } from 'zod';

/**
 * Shared pieces of the artist library scripts (collect, screen, upload, import): the research
 * file shape, the manifests they hand to each other, argument parsing and a small task pool.
 * Nothing here talks to the network or the database.
 */

// ---- research files ------------------------------------------------------------------------

const DirectImage = z.union([z.string(), z.object({ url: z.string(), pageUrl: z.string().optional() }).passthrough()]);

export const ResearchArtist = z
  .object({
    rank: z.number().int(),
    name: z.string().min(1),
    portfolioUrl: z.string().min(1),
    projectUrls: z.array(z.string()).default([]),
    directImageUrls: z.array(DirectImage).default([]),
    fit: z.string().optional(),
  })
  .passthrough();
export type ResearchArtist = z.infer<typeof ResearchArtist>;

export const ResearchStyle = z
  .object({
    slug: z.string().min(1),
    isNew: z.boolean().optional(),
    artists: z.array(ResearchArtist).default([]),
    seed: z.unknown().optional(),
  })
  .passthrough();
export type ResearchStyle = z.infer<typeof ResearchStyle>;

export const ResearchFile = z
  .object({ families: z.array(z.object({ slug: z.string().min(1), styles: z.array(ResearchStyle) }).passthrough()) })
  .passthrough();
export type ResearchFile = z.infer<typeof ResearchFile>;

export interface ResearchEntry {
  family: string;
  style: ResearchStyle;
  file: string;
}

/** Every style in a research JSON file, or in every *.json file of a directory. */
export function readResearch(path: string): ResearchEntry[] {
  const files = statSync(path).isDirectory()
    ? readdirSync(path)
        .filter((f) => f.endsWith('.json'))
        .sort()
        .map((f) => join(path, f))
    : [path];
  const out: ResearchEntry[] = [];
  for (const file of files) {
    const parsed = ResearchFile.safeParse(JSON.parse(readFileSync(file, 'utf8')));
    if (!parsed.success) {
      console.warn(`Skipping ${file}: ${parsed.error.issues[0]?.path.join('.')} ${parsed.error.issues[0]?.message}`);
      continue;
    }
    for (const family of parsed.data.families) for (const style of family.styles) out.push({ family: family.slug, style, file });
  }
  return out;
}

// ---- manifests -----------------------------------------------------------------------------

export interface ManifestArtist {
  name: string;
  slug: string;
  portfolioUrl: string;
}

/** One collected image (collect-manifest.json). `file` is relative to the output directory. */
export interface CollectEntry {
  family: string;
  style: string;
  artist: ManifestArtist;
  sourceUrl: string;
  imageUrl: string;
  file: string;
  width: number;
  height: number;
  /** Difference hash (hex), for de-duplication across runs. */
  dhash?: string;
}

/** One screened and described image (library-manifest.json). */
export interface LibraryEntry extends CollectEntry {
  onStyle: number;
  description: string;
  subjects: string[];
  mood: string;
  embedding: number[];
  embeddingModel: string;
  /** Written by the upload step. */
  cloudinaryUrl?: string;
  publicId?: string;
}

export const COLLECT_MANIFEST = 'collect-manifest.json';
export const LIBRARY_MANIFEST = 'library-manifest.json';

export function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

/** Writes through a temporary file so an interrupted run never leaves half a manifest. */
export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(tmp, path);
}

// ---- helpers -------------------------------------------------------------------------------

export function slugOf(text: string, max = 60): string {
  return (
    text
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, max)
      .replace(/-+$/, '') || 'artist'
  );
}

/** `--name value` and `--flag` arguments. Unknown names are an error, so typos never pass silently. */
export function parseFlags(argv: string[], spec: Record<string, 'string' | 'boolean'>): Record<string, string | boolean | undefined> {
  const out: Record<string, string | boolean | undefined> = {};
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i]!;
    if (!raw.startsWith('--')) throw new Error(`Unexpected argument: ${raw}`);
    const [name, inline] = raw.slice(2).split('=', 2) as [string, string | undefined];
    const kind = spec[name];
    if (!kind) throw new Error(`Unknown argument: --${name}`);
    if (kind === 'boolean') out[name] = inline === undefined ? true : inline !== 'false';
    else {
      const value = inline ?? argv[++i];
      if (value === undefined) throw new Error(`--${name} needs a value`);
      out[name] = value;
    }
  }
  return out;
}

/** Runs tasks with a fixed number in flight; stops starting new ones once `stop` returns true. */
export async function pool<T>(items: T[], size: number, run: (item: T) => Promise<void>, stop: () => boolean = () => false): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(size, items.length)) }, async () => {
    while (next < items.length && !stop()) {
      const item = items[next++]!;
      await run(item);
    }
  });
  await Promise.all(workers);
}
