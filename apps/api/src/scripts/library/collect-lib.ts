/**
 * Pure helpers for the artist library collector: robots.txt rules, image URL extraction from a
 * portfolio page, URL clean-up and type sniffing. No network, no file system, so all of it is
 * unit tested (collect-lib.test.ts).
 */

// ---- robots.txt ----------------------------------------------------------------------------

export interface RobotsRule {
  allow: boolean;
  path: string;
}

/**
 * The rules that apply to `User-agent: *` (RFC 9309). Groups naming other agents are ignored;
 * consecutive User-agent lines share the rules that follow them.
 */
export function parseRobots(text: string): RobotsRule[] {
  const rules: RobotsRule[] = [];
  let agents: string[] = [];
  let inRules = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1]!.toLowerCase();
    const value = m[2]!.trim();
    if (key === 'user-agent') {
      if (inRules) {
        agents = [];
        inRules = false;
      }
      agents.push(value.toLowerCase());
    } else if (key === 'allow' || key === 'disallow') {
      inRules = true;
      if (!agents.includes('*')) continue;
      if (key === 'disallow' && value === '') continue;
      rules.push({ allow: key === 'allow', path: value });
    }
  }
  return rules;
}

function ruleMatches(pattern: string, path: string): number {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const regex = new RegExp(`^${body.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}${anchored ? '$' : ''}`);
  return regex.test(path) ? body.length : -1;
}

/** Longest matching rule wins; on a tie, Allow wins. No matching rule means allowed. */
export function robotsAllows(rules: RobotsRule[], pathWithQuery: string): boolean {
  let best = -1;
  let allowed = true;
  for (const rule of rules) {
    const len = ruleMatches(rule.path, pathWithQuery);
    if (len < 0) continue;
    if (len > best || (len === best && rule.allow)) {
      best = len;
      allowed = rule.allow;
    }
  }
  return allowed;
}

// ---- image candidates ----------------------------------------------------------------------

export interface ImageCandidate {
  /** Best guess at the largest version. */
  url: string;
  /** Tried in order when `url` fails (for example the original of an upgraded URL). */
  alternates: string[];
  /** Pixel width when the page states it. */
  width: number | null;
}

const ATTR = /([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;

function attributes(tag: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of tag.matchAll(ATTR)) out.set(m[1]!.toLowerCase(), decodeEntities(m[3] ?? m[4] ?? m[5] ?? ''));
  return out;
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/** srcset entries with their width (or density times 1000 when only `x` is given). */
export function parseSrcset(srcset: string): { url: string; width: number | null }[] {
  const out: { url: string; width: number | null }[] = [];
  // Entries are split on ", " or on a comma right after a descriptor; a bare comma can be part of a
  // URL (Cloudinary transformations).
  for (const part of srcset.split(/,\s+|(?<=\d[wx]),/)) {
    const [url, descriptor] = part.trim().split(/\s+/, 2);
    if (!url) continue;
    const d = descriptor ? /^(\d+(?:\.\d+)?)([wx])$/.exec(descriptor) : null;
    const n = d ? Number(d[1]) : null;
    out.push({ url: url.replace(/,$/, ''), width: n === null ? null : d![2] === 'w' ? n : Math.round(n * 1000) });
  }
  return out;
}

function largestOf(entries: { url: string; width: number | null }[]): { url: string; width: number | null } | null {
  if (!entries.length) return null;
  return [...entries].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]!;
}

/** Behance project module sizes, largest first. */
const BEHANCE_SIZES = ['source', 'max_3840', 'fs', 'max_3840_webp', '1400_opt_1', '1400', 'max_1200', 'hd', '1200', 'disp', 'max_808', '808', 'max_632', '600', '404', '230', '202', '115'];
const BEHANCE_MODULE = /^(https?:\/\/[^/]*behance\.net\/project_modules\/)([^/]+)\/(.+)$/;

function behanceRank(url: string): number {
  const m = BEHANCE_MODULE.exec(url);
  if (!m) return -1;
  const i = BEHANCE_SIZES.indexOf(m[2]!);
  return i === -1 ? BEHANCE_SIZES.length : i;
}

const UI_WORDS = /(^|[/_.-])(logo|logos|icon|icons|favicon|avatar|avatars|gravatar|sprite|sprites|badge|emoji|spinner|loader|loading|placeholder|blank|pixel|tracking|social|share|button|btn|arrow|caret|close|menu|hamburger|cursor|profile[-_]?(pic|photo|image)|user[-_]?photo|headshot)([/_.-]|$)/i;
const BAD_HOSTS = /(^|\.)(gravatar\.com|google-analytics\.com|googletagmanager\.com|doubleclick\.net|facebook\.com|facebook\.net|twitter\.com|scorecardresearch\.com|hotjar\.com|adobe\.com|typekit\.net)$/i;

/** Logos, icons, avatars, sprites, vector or animated files, and anything stated under 600px. */
export function looksLikeUiImage(url: string, width: number | null): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return true;
  }
  if (!/^https?:$/.test(parsed.protocol)) return true;
  if (BAD_HOSTS.test(parsed.hostname)) return true;
  const path = decodeURIComponent(parsed.pathname).toLowerCase();
  if (/\.(svg|gif|ico|bmp|tiff?|avif|heic)$/.test(path)) return true;
  if (/[-_.]blur\d*[-_.]/.test(path)) return true;
  if (UI_WORDS.test(path)) return true;
  if (width !== null && width < 600) return true;
  return false;
}

/** Resolves against the page, drops fragments, forces https where the page is https. */
export function normaliseUrl(raw: string, base: string): string | null {
  const trimmed = decodeEntities(raw.trim());
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('javascript:')) return null;
  try {
    const u = new URL(trimmed, base);
    if (!/^https?:$/.test(u.protocol)) return null;
    u.hash = '';
    if (u.protocol === 'http:' && new URL(base).protocol === 'https:') u.protocol = 'https:';
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * The URL most likely to give the largest image, with fallbacks: Squarespace `?format=2500w`,
 * WordPress originals without the `-1024x683` suffix. Anything else is returned as is.
 */
export function upgradeUrl(url: string): { url: string; alternates: string[] } {
  const u = new URL(url);
  if (/(^|\.)squarespace-cdn\.com$|(^|\.)squarespace\.com$/.test(u.hostname) && /\.(jpe?g|png|webp)$/i.test(u.pathname)) {
    const best = new URL(u.toString());
    best.search = '?format=2500w';
    return best.toString() === url ? { url, alternates: [] } : { url: best.toString(), alternates: [url] };
  }
  const drupal = /^(.*\/files)\/styles\/[^/]+\/(?:public|private)\/(.+\.(?:jpe?g|png|webp))$/i.exec(u.pathname);
  if (drupal) {
    const original = new URL(u.toString());
    original.pathname = `${drupal[1]}/${drupal[2]}`;
    original.search = '';
    return { url: original.toString(), alternates: [url] };
  }
  const wp = /^(.*)-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp))$/i.exec(u.pathname);
  if (wp && /\/wp-content\/uploads\//.test(u.pathname)) {
    const original = new URL(u.toString());
    original.pathname = `${wp[1]}${wp[2]}`;
    return { url: original.toString(), alternates: [url] };
  }
  return { url, alternates: [] };
}

/** Identity for de-duplication: the same file at another size or format counts once. */
export function dedupeKey(url: string): string {
  const behance = BEHANCE_MODULE.exec(url);
  if (behance) return `behance:${behance[3]!.replace(/\.(jpe?g|png|webp|gif)$/i, '')}`;
  const u = new URL(url);
  if (/squarespace/.test(u.hostname)) return `${u.hostname}${u.pathname}`;
  const drupal = /^(.*\/files)\/styles\/[^/]+\/(?:public|private)\/(.+)$/i.exec(u.pathname);
  if (drupal) return `${u.hostname}${drupal[1]}/${drupal[2]}`;
  const cloudflare = /^\/cdn-cgi\/image\/[^/]+(\/.*)$/.exec(u.pathname);
  if (cloudflare) return `${u.hostname}${cloudflare[1]}`;
  const wp = /^(.*)-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp))$/i.exec(u.pathname);
  if (wp && /\/wp-content\/uploads\//.test(u.pathname)) return `${u.hostname}${wp[1]}${wp[2]}`;
  return `${u.hostname}${u.pathname}${u.search}`;
}

/**
 * Candidate images on a page, in page order: og:image and twitter:image first, then <img> and
 * <source> (largest srcset entry), links straight to image files, and Behance project modules
 * found anywhere in the HTML (Behance renders them from embedded data).
 */
export function extractImageCandidates(html: string, pageUrl: string): ImageCandidate[] {
  const found: { url: string; width: number | null }[] = [];
  const isBehancePage = /(^|\.)behance\.net$/.test(new URL(pageUrl).hostname);

  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attributes(m[0]);
    const key = (a.get('property') ?? a.get('name') ?? '').toLowerCase();
    if (['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src'].includes(key) && a.get('content')) {
      found.push({ url: a.get('content')!, width: null });
    }
  }
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const a = attributes(m[0]);
    if ((a.get('rel') ?? '').toLowerCase() === 'image_src' && a.get('href')) found.push({ url: a.get('href')!, width: null });
  }
  for (const m of html.matchAll(/<(img|source)\b[^>]*>/gi)) {
    const a = attributes(m[0]);
    const set = a.get('data-srcset') ?? a.get('srcset') ?? a.get('data-lazy-srcset');
    const fromSet = set ? largestOf(parseSrcset(set)) : null;
    const dims = /^(\d+)x(\d+)$/.exec(a.get('data-image-dimensions') ?? '');
    const declared = dims ? Number(dims[1]) : null;
    // With a srcset, src is just one of its sizes; Squarespace's data-image is the original.
    const plain = a.get('data-image') ?? (fromSet ? undefined : (a.get('data-src') ?? a.get('data-original') ?? a.get('data-lazy-src') ?? a.get('data-full') ?? a.get('src')));
    if (fromSet) found.push({ url: fromSet.url, width: fromSet.width ?? declared });
    if (plain) {
      const attrWidth = Number(a.get('width'));
      found.push({ url: plain, width: declared ?? (!fromSet && Number.isFinite(attrWidth) && attrWidth > 0 ? attrWidth : null) });
    }
  }
  for (const m of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = attributes(m[0]).get('href');
    if (href && /\.(jpe?g|png|webp)(\?[^"']*)?$/i.test(href)) found.push({ url: href, width: null });
  }
  for (const m of html.matchAll(/https?:\\?\/\\?\/[a-z0-9.-]*behance\.net\\?\/project_modules\\?\/[^"'\s)<>\\]+(?:\\\/[^"'\s)<>\\]+)*/gi)) {
    found.push({ url: m[0].replace(/\\\//g, '/'), width: null });
  }

  // Normalise, then keep the best variant per image identity, in first-seen order.
  const order: string[] = [];
  const best = new Map<string, { url: string; width: number | null }>();
  for (const f of found) {
    const url = normaliseUrl(f.url, pageUrl);
    if (!url) continue;
    if (isBehancePage && /behance\.net/.test(new URL(url).hostname) && !BEHANCE_MODULE.test(url)) continue;
    const key = dedupeKey(url);
    const current = best.get(key);
    if (!current) {
      order.push(key);
      best.set(key, { url, width: f.width });
      continue;
    }
    const better =
      behanceRank(url) >= 0 && behanceRank(current.url) >= 0 ? behanceRank(url) < behanceRank(current.url) : (f.width ?? 0) > (current.width ?? 0);
    if (better) best.set(key, { url, width: f.width ?? current.width });
  }

  const out: ImageCandidate[] = [];
  for (const key of order) {
    const c = best.get(key)!;
    if (looksLikeUiImage(c.url, c.width)) continue;
    const upgraded = upgradeUrl(c.url);
    out.push({ url: upgraded.url, alternates: upgraded.alternates, width: c.width });
  }
  return out;
}

// ---- downloaded bytes ----------------------------------------------------------------------

/** Only JPEG, PNG and WebP are accepted, judged by their first bytes, never by the header. */
export function sniffImageType(buf: Uint8Array): 'jpeg' | 'png' | 'webp' | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return 'png';
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  )
    return 'webp';
  return null;
}
