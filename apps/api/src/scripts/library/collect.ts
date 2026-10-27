/**
 * Collects candidate artworks for the artist library from public portfolio pages.
 *
 *   bun run library:collect -- --in <research.json | research-dir> --out <dir>
 *   bun run library:collect -- --in research/ --out out/library --style linocut --max-per-artist 25 --artists 6
 *
 * For each style and each of its top artists (ranks 1 to --artists, default 4, at most 10) it reads the portfolio and project pages,
 * finds the largest version of every artwork image, downloads it (JPEG, PNG or WebP only, at most
 * 15 MB), re-encodes it with sharp to WebP at most 1600 wide (which drops every byte of the
 * original file, metadata included), and writes
 *
 *   <out>/<family>/<style>/<artist-slug>/<n>.webp
 *   <out>/collect-manifest.json
 *
 * Polite by construction: one request per second per host, robots.txt honoured for
 * `User-agent: *`, a fixed identifying user agent, no cookies, no log-ins. A host that answers
 * 403 is skipped for the rest of the run; 429 waits once and then skips. Re-running resumes:
 * images already in the manifest, and URLs already turned down, are not fetched again.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';
import { dHash, hammingDistance } from '../../lib/image';
import { artistsFlag, extractImageCandidates, parseRobots, robotsAllows, sniffImageType, topRanked, upgradeUrl, type ImageCandidate, type RobotsRule } from './collect-lib';
import { artistName, COLLECT_MANIFEST, parseFlags, pool, readJson, readResearch, slugOf, writeJson, type CollectEntry, type ResearchArtist, type ResearchEntry } from './common';

const USER_AGENT = 'editorial-art-library/1.0 (+ET AI team)';
const TIMEOUT_MS = 20_000;
const HOST_GAP_MS = 1_000;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_HTML_BYTES = 6 * 1024 * 1024;
const MAX_WIDTH = 1600;
const MIN_SHORT_SIDE = 500;
const DUPLICATE_DISTANCE = 6;
const SKIPPED_FILE = 'collect-skipped.json';

class Skip extends Error {
  constructor(
    readonly reason: string,
    /** Permanent reasons are remembered so a re-run does not fetch the URL again. */
    readonly permanent: boolean
  ) {
    super(reason);
  }
}

// ---- polite HTTP ---------------------------------------------------------------------------

const nextSlot = new Map<string, number>();
const robotsCache = new Map<string, Promise<RobotsRule[] | 'all'>>();
const blockedHosts = new Map<string, string>();

/** Waits for this host's next free one-second slot. Slots are reserved synchronously, so concurrent callers queue. */
async function hostGate(host: string): Promise<void> {
  const now = Date.now();
  const at = Math.max(now, nextSlot.get(host) ?? 0);
  nextSlot.set(host, at + HOST_GAP_MS);
  if (at > now) await new Promise((r) => setTimeout(r, at - now));
}

async function readCapped(res: Response, cap: number): Promise<Buffer> {
  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > cap) throw new Skip('too-large', true);
  if (!res.body) return Buffer.alloc(0);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > cap) {
      await reader.cancel().catch(() => undefined);
      throw new Skip('too-large', true);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

const ACCEPT = { page: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5', image: 'image/jpeg,image/png,image/webp;q=0.9,*/*;q=0.1' };

async function rawGet(url: string, accept = '*/*'): Promise<Response> {
  const host = new URL(url).host;
  await hostGate(host);
  return fetch(url, {
    headers: { 'user-agent': USER_AGENT, accept },
    redirect: 'manual',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

/** RFC 9309: 4xx means no rules, 5xx or no answer means stay away. */
function robotsFor(origin: string): Promise<RobotsRule[] | 'all'> {
  let cached = robotsCache.get(origin);
  if (!cached) {
    cached = (async () => {
      try {
        const res = await rawGet(`${origin}/robots.txt`);
        if (res.status >= 300 && res.status < 400) {
          const to = res.headers.get('location');
          if (!to) return [];
          const target = new URL(to, `${origin}/robots.txt`);
          if (target.origin === origin) return [];
          const again = await rawGet(target.toString());
          return again.ok ? parseRobots((await readCapped(again, 512 * 1024)).toString('utf8')) : again.status < 500 ? [] : 'all';
        }
        if (res.ok) return parseRobots((await readCapped(res, 512 * 1024)).toString('utf8'));
        return res.status < 500 ? [] : 'all';
      } catch {
        return 'all';
      }
    })();
    robotsCache.set(origin, cached);
  }
  return cached;
}

/** GET with robots.txt, per-host pacing, manual redirects (each hop checked) and 403/429 handling. */
async function politeGet(url: string, cap: number, accept: string): Promise<{ body: Buffer; finalUrl: string; contentType: string }> {
  let current = url;
  for (let hop = 0; hop < 5; hop++) {
    const u = new URL(current);
    if (blockedHosts.has(u.host)) throw new Skip(`host-blocked (${blockedHosts.get(u.host)})`, false);
    const rules = await robotsFor(u.origin);
    if (rules === 'all' || !robotsAllows(rules, `${u.pathname}${u.search}`)) throw new Skip('robots', true);

    let res = await rawGet(current, accept);
    if (res.status === 429) {
      const wait = Math.min(120, Number(res.headers.get('retry-after')) || 30);
      console.warn(`  429 from ${u.host}, waiting ${wait}s once`);
      await new Promise((r) => setTimeout(r, wait * 1000));
      res = await rawGet(current, accept);
    }
    if (res.status === 403 || res.status === 429) {
      blockedHosts.set(u.host, String(res.status));
      console.warn(`  ${res.status} from ${u.host}: skipping this host for the rest of the run`);
      throw new Skip(`http-${res.status}`, false);
    }
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) throw new Skip('redirect-without-location', true);
      current = new URL(location, current).toString();
      continue;
    }
    if (res.status === 401) throw new Skip('needs-login', true);
    if (!res.ok) throw new Skip(`http-${res.status}`, res.status === 404 || res.status === 410);
    const body = await readCapped(res, cap);
    return { body, finalUrl: current, contentType: res.headers.get('content-type') ?? '' };
  }
  throw new Skip('too-many-redirects', true);
}

// ---- one image -----------------------------------------------------------------------------

interface Saved {
  buffer: Buffer;
  width: number;
  height: number;
  hash: bigint;
  usedUrl: string;
}

async function downloadAndReencode(candidate: ImageCandidate): Promise<Saved> {
  let lastError: unknown = null;
  for (const url of [candidate.url, ...candidate.alternates]) {
    try {
      const { body } = await politeGet(url, MAX_IMAGE_BYTES, ACCEPT.image);
      if (!sniffImageType(body)) throw new Skip('not-jpeg-png-webp', true);
      // Decode and re-encode: nothing of the original file survives except its pixels.
      const { data, info } = await sharp(body, { failOn: 'error', limitInputPixels: 100_000_000 })
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 88 })
        .toBuffer({ resolveWithObject: true });
      if (Math.min(info.width, info.height) < MIN_SHORT_SIDE) throw new Skip('too-small', true);
      return { buffer: data, width: info.width, height: info.height, hash: await dHash(data), usedUrl: url };
    } catch (error) {
      lastError = error;
      if (error instanceof Skip && ['too-small', 'not-jpeg-png-webp'].includes(error.reason)) throw error;
    }
  }
  if (lastError instanceof Skip) throw lastError;
  throw new Skip(`error: ${lastError instanceof Error ? lastError.message.slice(0, 80) : String(lastError)}`, false);
}

// ---- one artist ----------------------------------------------------------------------------

interface ArtistStats {
  name: string;
  pages: number;
  candidates: number;
  saved: number;
  existing: number;
  reasons: Map<string, number>;
}

interface Context {
  out: string;
  maxPerArtist: number;
  manifest: CollectEntry[];
  skipped: Record<string, string>;
  save(): void;
}

function directUrls(artist: ResearchArtist): { url: string; pageUrl: string | null }[] {
  return artist.directImageUrls.map((d) => (typeof d === 'string' ? { url: d, pageUrl: null } : { url: d.url, pageUrl: d.pageUrl ?? null }));
}

async function collectArtist(ctx: Context, entry: ResearchEntry, artist: ResearchArtist, styleHashes: bigint[]): Promise<ArtistStats> {
  const name = artistName(artist.name);
  const slug = slugOf(name);
  const stats: ArtistStats = { name, pages: 0, candidates: 0, saved: 0, existing: 0, reasons: new Map() };
  const bump = (reason: string) => stats.reasons.set(reason, (stats.reasons.get(reason) ?? 0) + 1);
  const mine = () => ctx.manifest.filter((m) => m.style === entry.style.slug && m.artist.slug === slug);
  stats.existing = mine().length;
  if (stats.existing >= ctx.maxPerArtist) return stats;

  const artistHashes = mine().flatMap((m) => (m.dhash ? [BigInt(`0x${m.dhash}`)] : []));
  const known = new Set(ctx.manifest.filter((m) => m.style === entry.style.slug).map((m) => m.imageUrl));

  // Candidates: the given direct images first, then whatever the pages show.
  const firstPage = artist.projectUrls[0] ?? artist.portfolioUrl;
  const queue: { candidate: ImageCandidate; sourceUrl: string }[] = [];
  for (const d of directUrls(artist)) {
    try {
      const up = upgradeUrl(new URL(d.url).toString());
      queue.push({ candidate: { url: up.url, alternates: up.alternates, width: null }, sourceUrl: d.pageUrl ?? firstPage });
    } catch {
      bump('bad-url');
    }
  }
  for (const page of [...new Set([artist.portfolioUrl, ...artist.projectUrls])]) {
    try {
      const { body, finalUrl, contentType } = await politeGet(page, MAX_HTML_BYTES, ACCEPT.page);
      if (contentType && !/html|xml|text/i.test(contentType)) throw new Skip('not-html', true);
      stats.pages++;
      for (const candidate of extractImageCandidates(body.toString('utf8'), finalUrl)) queue.push({ candidate, sourceUrl: page });
    } catch (error) {
      bump(`page ${error instanceof Skip ? error.reason : 'error'}`);
    }
  }

  const seen = new Set<string>();
  const attempts = ctx.maxPerArtist * 3;
  let tried = 0;
  const dir = join(ctx.out, entry.family, entry.style.slug, slug);
  for (const { candidate, sourceUrl } of queue) {
    if (stats.existing + stats.saved >= ctx.maxPerArtist || tried >= attempts) break;
    if (seen.has(candidate.url)) continue;
    seen.add(candidate.url);
    stats.candidates++;
    if (known.has(candidate.url) || [candidate.url, ...candidate.alternates].some((u) => known.has(u))) continue;
    if (ctx.skipped[candidate.url]) {
      bump(ctx.skipped[candidate.url]!);
      continue;
    }
    tried++;
    try {
      const img = await downloadAndReencode(candidate);
      if ([...artistHashes, ...styleHashes].some((h) => hammingDistance(h, img.hash) <= DUPLICATE_DISTANCE)) throw new Skip('duplicate', true);
      mkdirSync(dir, { recursive: true });
      let n = mine().length + 1;
      while (existsSync(join(dir, `${n}.webp`))) n++;
      const file = join(dir, `${n}.webp`);
      writeFileSync(file, img.buffer);
      artistHashes.push(img.hash);
      styleHashes.push(img.hash);
      known.add(candidate.url);
      ctx.manifest.push({
        family: entry.family,
        style: entry.style.slug,
        artist: { name, slug, portfolioUrl: artist.portfolioUrl },
        sourceUrl,
        imageUrl: candidate.url,
        file: relative(ctx.out, file),
        width: img.width,
        height: img.height,
        dhash: img.hash.toString(16).padStart(16, '0'),
      });
      stats.saved++;
      ctx.save();
    } catch (error) {
      const skip = error instanceof Skip ? error : new Skip('error', false);
      bump(skip.reason.startsWith('error') ? 'error' : skip.reason);
      if (skip.permanent) {
        ctx.skipped[candidate.url] = skip.reason;
        ctx.save();
      }
    }
  }
  return stats;
}

// ---- main ----------------------------------------------------------------------------------

function formatReasons(reasons: Map<string, number>): string {
  return [...reasons].map(([r, n]) => `${r} ${n}`).join(', ');
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2), { in: 'string', out: 'string', style: 'string', 'max-per-artist': 'string', artists: 'string', concurrency: 'string' });
  if (!flags.in || !flags.out) throw new Error('Pass --in <research.json or directory> and --out <directory>.');
  const out = String(flags.out);
  const maxPerArtist = Math.max(1, Math.min(60, Number(flags['max-per-artist'] ?? 25) || 25));
  const concurrency = Math.max(1, Math.min(12, Number(flags.concurrency ?? 4) || 4));
  const topArtists = artistsFlag(flags.artists);
  mkdirSync(out, { recursive: true });

  const manifestPath = join(out, COLLECT_MANIFEST);
  const skippedPath = join(out, SKIPPED_FILE);
  const ctx: Context = {
    out,
    maxPerArtist,
    manifest: readJson<CollectEntry[]>(manifestPath, []).filter((m) => existsSync(join(out, m.file))),
    skipped: readJson<Record<string, string>>(skippedPath, {}),
    save() {
      writeJson(manifestPath, ctx.manifest);
      writeJson(skippedPath, ctx.skipped);
    },
  };

  const entries = readResearch(String(flags.in)).filter((e) => !flags.style || e.style.slug === flags.style);
  if (!entries.length) throw new Error('No styles found in the research input.');
  console.log(`Collecting ${entries.length} styles into ${out} (top ${topArtists} artists, max ${maxPerArtist} per artist).`);

  let total = 0;
  await pool(entries, concurrency, async (entry) => {
    const artists = topRanked(entry.style.artists, topArtists);
    const styleHashes = ctx.manifest.filter((m) => m.style === entry.style.slug && m.dhash).map((m) => BigInt(`0x${m.dhash}`));
    const lines: string[] = [];
    let styleSaved = 0;
    for (const artist of artists) {
      const s = await collectArtist(ctx, entry, artist, styleHashes);
      styleSaved += s.existing + s.saved;
      lines.push(
        `  ${s.name.padEnd(28)} pages ${s.pages}  candidates ${s.candidates}  new ${s.saved}  kept before ${s.existing}${s.reasons.size ? `  skipped: ${formatReasons(s.reasons)}` : ''}`
      );
    }
    total += styleSaved;
    console.log(`\n${entry.family}/${entry.style.slug}: ${styleSaved} images from ${artists.length} artists\n${lines.join('\n')}`);
  });

  ctx.save();
  console.log(`\nDone: ${ctx.manifest.length} images in ${manifestPath} (${total} in the styles of this run).`);
  if (blockedHosts.size) console.log(`Hosts skipped after 403/429: ${[...blockedHosts.keys()].join(', ')}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
