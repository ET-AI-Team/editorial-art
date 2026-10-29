import axios from 'axios';
import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { fetchRemoteImage } from '../lib/remote-image';
import { fold } from '../pipeline/guard/sensitivity';

/**
 * Finds the face of a public figure named in a story, from public, openly licensed sources only:
 * the person's Wikidata item (a human, P31 = Q5, with an image, P18) and that image's file on
 * Wikimedia Commons, with its licence and author for the credit. Never a general web image search,
 * never a private individual (no Wikidata item, no match) and never a minor (born under 18 years ago).
 *
 * Unsure means null: a weak best match, or two people about equally likely, is shown symbolically.
 * Every call carries a User-Agent with a contact, as Wikimedia's policy asks, and a timeout.
 */

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const COMMONS_UPLOADS = 'https://upload.wikimedia.org/';
const CALL_TIMEOUT_MS = 5_000;
const IMAGE_TIMEOUT_MS = 10_000;

/** Below this, or this close to the runner-up, the match is not trusted. */
export const MIN_SCORE = 0.5;
export const MIN_MARGIN = 0.15;
/** Runners-up kept for "Try another" must still be plausible. */
const ALTERNATIVE_MIN_SCORE = 0.35;
const SEARCH_LIMIT = 10;

export function wikimediaUserAgent(): string {
  return `ETArticlesArt/0.1 (${env().EA_WIKIMEDIA_CONTACT}) axios/1`;
}

// ---- transport -----------------------------------------------------------------------------

export type WikiJson = (url: string, params: Record<string, string>) => Promise<unknown>;

const axiosJson: WikiJson = async (url, params) => {
  const res = await axios.get(url, {
    params: { ...params, format: 'json', formatversion: '2' },
    timeout: CALL_TIMEOUT_MS,
    headers: { 'User-Agent': wikimediaUserAgent(), Accept: 'application/json' },
  });
  return res.data;
};

let http: WikiJson = axiosJson;

/** Tests only: answer Wikidata and Commons calls from recorded responses. */
export function setWikimediaHttpForTests(fn?: WikiJson): void {
  http = fn ?? axiosJson;
  cache.clear();
}

// ---- Wikidata shapes (only what is read) ---------------------------------------------------

interface SearchHit {
  id: string;
  label?: string;
  description?: string;
  match?: { type?: string; text?: string };
}

interface Snak {
  mainsnak?: { snaktype?: string; datavalue?: { value?: unknown } };
  rank?: string;
}

interface Entity {
  id: string;
  missing?: unknown;
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  aliases?: Record<string, { value: string }[]>;
  claims?: Record<string, Snak[]>;
  sitelinks?: Record<string, unknown>;
}

/** A human with an image, as the scorer sees them. */
export interface WikiPerson {
  id: string;
  /** English label when there is one, else Hindi. */
  label: string;
  /** The label in the other language, matched as strongly as the label. */
  otherLabels: string[];
  description: string;
  aliases: string[];
  /** The Commons file name from P18, without "File:". */
  imageFile: string;
  /** Year of birth from P569, when known. */
  bornYear: number | null;
  citizenships: string[];
  /** Occupations (P106), employers (P108) and positions held (P39). */
  related: string[];
  sitelinks: number;
  /** Position in the search results, 0 first. */
  searchRank: number;
}

/** What the read knows about a person, to tell namesakes apart. */
export interface PersonContext {
  role?: string;
  orgs?: string[];
  /** True for an Indian story (every desk but world, or a place in India). */
  india?: boolean;
}

export interface Candidate {
  wikidataId: string;
  label: string;
  description: string;
  imageFile: string;
  score: number;
}

export interface Resolution {
  best: Candidate;
  /** Plausible runners-up, best first, for "Try another". */
  alternatives: Candidate[];
}

function claimValues(entity: Entity, property: string): unknown[] {
  return (entity.claims?.[property] ?? [])
    .filter((s) => s.rank !== 'deprecated' && s.mainsnak?.snaktype === 'value')
    .map((s) => s.mainsnak?.datavalue?.value)
    .filter((v) => v !== undefined);
}

function itemIds(entity: Entity, property: string): string[] {
  return claimValues(entity, property)
    .map((v) => (v as { id?: string }).id)
    .filter((id): id is string => typeof id === 'string');
}

function bornYear(entity: Entity): number | null {
  for (const v of claimValues(entity, 'P569')) {
    const m = /^([+-]\d+)-/.exec((v as { time?: string }).time ?? '');
    if (m) return Number(m[1]);
  }
  return null;
}

function text(map: Record<string, { value: string }> | undefined): string {
  return map?.en?.value ?? map?.hi?.value ?? '';
}

/** A Wikidata entity as a person the scorer can use, or null when it is not a human with an image. */
export function toWikiPerson(entity: Entity, searchRank: number): WikiPerson | null {
  if (entity.missing !== undefined) return null;
  if (!itemIds(entity, 'P31').includes('Q5')) return null;
  const image = claimValues(entity, 'P18').find((v): v is string => typeof v === 'string');
  if (!image) return null;
  const label = text(entity.labels);
  return {
    id: entity.id,
    label,
    otherLabels: [entity.labels?.en?.value, entity.labels?.hi?.value].filter((l): l is string => !!l && l !== label),
    description: text(entity.descriptions),
    aliases: [...(entity.aliases?.en ?? []), ...(entity.aliases?.hi ?? [])].map((a) => a.value),
    imageFile: image,
    bornYear: bornYear(entity),
    citizenships: itemIds(entity, 'P27'),
    related: [...itemIds(entity, 'P106'), ...itemIds(entity, 'P108'), ...itemIds(entity, 'P39')],
    sitelinks: Object.keys(entity.sitelinks ?? {}).length,
    searchRank,
  };
}

// ---- scoring (pure) ------------------------------------------------------------------------

const HONORIFICS = new Set(['mr', 'mrs', 'ms', 'dr', 'shri', 'smt', 'sri', 'sir', 'justice', 'prof', 'professor']);
const STOP = new Set(['the', 'of', 'and', 'for', 'ltd', 'limited', 'pvt', 'private', 'inc', 'co', 'corp', 'corporation', 'company', 'group', 'plc', 'llp', 'india', 'indian', 'its', 'former', 'new']);
const INDIA = 'Q668';

export function nameTokens(name: string): string[] {
  return fold(name)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t && !HONORIFICS.has(t));
}

/** How well the name in the story matches the person's label or aliases. */
export function nameScore(query: string, person: Pick<WikiPerson, 'label' | 'aliases'> & { otherLabels?: string[] }): number {
  const q = nameTokens(query);
  if (!q.length) return 0;
  const labels = [person.label, ...(person.otherLabels ?? [])].map(nameTokens).filter((t) => t.length);
  const aliases = person.aliases.map(nameTokens).filter((t) => t.length);
  const names = [...labels, ...aliases];
  const same = (a: string[]) => a.join(' ') === q.join(' ');
  if (labels.some(same)) return 0.45;
  if (aliases.some(same)) return 0.35;
  // "N. Chandrasekaran" against "Natarajan Chandrasekaran": same surname, initials that fit.
  const initials = (a: string[]) => a.length === q.length && a[a.length - 1] === q[q.length - 1] && q.every((t, i) => t === a[i] || (t.length === 1 && a[i]!.startsWith(t)));
  if (names.some(initials)) return 0.3;
  if (names.some((a) => q.every((t) => a.includes(t)))) return 0.2;
  return 0.05;
}

function significant(textValue: string): string[] {
  return nameTokens(textValue).filter((t) => t.length >= 3 && !STOP.has(t));
}

/** Company, role and India: what tells two people of one name apart. */
export function contextScore(person: WikiPerson, ctx: PersonContext, relatedLabels: Map<string, string>): number {
  const hay = ` ${nameTokens([person.description, ...person.related.map((id) => relatedLabels.get(id) ?? '')].join(' ')).join(' ')} `;
  const has = (token: string) => hay.includes(` ${token} `);
  let orgs = 0;
  for (const org of (ctx.orgs ?? []).slice(0, 8)) {
    const tokens = significant(org);
    if (!tokens.length) continue;
    if (tokens.every(has)) orgs += 0.25;
    else if (tokens.some((t) => t.length >= 4 && has(t))) orgs += 0.1;
  }
  let role = 0;
  for (const token of significant(ctx.role ?? '')) if (token.length >= 4 && has(token)) role += 0.05;
  let india = 0;
  if (ctx.india) india = person.citizenships.includes(INDIA) ? 0.15 : has('india') || has('indian') ? 0.1 : 0;
  return Math.min(orgs, 0.35) + Math.min(role, 0.1) + india;
}

export function scorePerson(query: string, person: WikiPerson, ctx: PersonContext, relatedLabels: Map<string, string>): number {
  const fame = (Math.min(person.sitelinks, 40) / 40) * 0.1;
  const rank = person.searchRank === 0 ? 0.05 : person.searchRank === 1 ? 0.02 : 0;
  return Math.round((nameScore(query, person) + contextScore(person, ctx, relatedLabels) + fame + rank) * 1000) / 1000;
}

/** A best match only when it is good enough and clearly ahead of the next. */
export function decide(scored: Candidate[]): Resolution | null {
  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const [best, second] = ranked;
  if (!best || best.score < MIN_SCORE) return null;
  if (second && best.score - second.score < MIN_MARGIN) return null;
  return { best, alternatives: ranked.slice(1).filter((c) => c.score >= ALTERNATIVE_MIN_SCORE).slice(0, 3) };
}

export function isMinor(bornYearValue: number | null, now = new Date()): boolean {
  return bornYearValue !== null && now.getUTCFullYear() - bornYearValue < 19;
}

// ---- lookups -------------------------------------------------------------------------------

async function search(name: string, language: string): Promise<SearchHit[]> {
  const res = (await http(WIKIDATA_API, { action: 'wbsearchentities', search: name, language, uselang: 'en', type: 'item', limit: String(SEARCH_LIMIT) })) as { search?: SearchHit[] };
  return res.search ?? [];
}

async function entities(ids: string[], props: string): Promise<Entity[]> {
  if (!ids.length) return [];
  const res = (await http(WIKIDATA_API, { action: 'wbgetentities', ids: ids.join('|'), props, languages: 'en|hi' })) as { entities?: Record<string, Entity> | Entity[] };
  const all = res.entities ?? {};
  return Array.isArray(all) ? all : Object.values(all);
}

const DEVANAGARI = /[ऀ-ॿ]/;

/** Humans with an image who match the name, in search order. */
async function candidatesFor(name: string): Promise<WikiPerson[]> {
  const languages = DEVANAGARI.test(name) ? ['hi', 'en'] : ['en'];
  const hits: SearchHit[] = [];
  for (const language of languages) {
    for (const hit of await search(name, language)) if (!hits.some((h) => h.id === hit.id)) hits.push(hit);
  }
  const found = await entities(
    hits.slice(0, SEARCH_LIMIT).map((h) => h.id),
    'labels|descriptions|aliases|claims|sitelinks'
  );
  const order = new Map(hits.map((h, i) => [h.id, i]));
  return found
    .map((e) => toWikiPerson(e, order.get(e.id) ?? SEARCH_LIMIT))
    .filter((p): p is WikiPerson => !!p && !isMinor(p.bornYear))
    .sort((a, b) => a.searchRank - b.searchRank);
}

async function relatedLabels(people: WikiPerson[]): Promise<Map<string, string>> {
  const ids = [...new Set(people.flatMap((p) => p.related))].slice(0, 50);
  const found = await entities(ids, 'labels');
  return new Map(found.map((e) => [e.id, text(e.labels)]));
}

// ---- cache ---------------------------------------------------------------------------------

const TTL_MS = 6 * 60 * 60_000;
const MAX_ENTRIES = 300;
const cache = new Map<string, { at: number; value: Promise<Resolution | null> }>();

function cacheKey(name: string, ctx: PersonContext): string {
  return [nameTokens(name).join(' '), [...(ctx.orgs ?? [])].map((o) => significant(o).join(' ')).sort().join(','), significant(ctx.role ?? '').join(' '), ctx.india ? 'in' : ''].join('|');
}

/**
 * The person a story most likely means, with a Commons image, or null when unsure. Network
 * trouble is also null (logged): a missing face never stops an article.
 */
export function resolvePerson(name: string, ctx: PersonContext): Promise<Resolution | null> {
  const key = cacheKey(name, ctx);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const value = lookUp(name, ctx).catch((err: unknown) => {
    logger.warn({ err: err instanceof Error ? err.message : String(err), name }, 'wikidata_lookup_failed');
    cache.delete(key);
    return null;
  });
  cache.set(key, { at: Date.now(), value });
  if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value!);
  return value;
}

async function lookUp(name: string, ctx: PersonContext): Promise<Resolution | null> {
  const people = await candidatesFor(name);
  if (!people.length) return null;
  const labels = await relatedLabels(people);
  const scored = people.map((p) => ({ wikidataId: p.id, label: p.label || name, description: p.description, imageFile: p.imageFile, score: scorePerson(name, p, ctx, labels) }));
  return decide(scored);
}

// ---- Commons -------------------------------------------------------------------------------

export interface CommonsImage {
  /** A thumbnail at most 1024 wide (the file itself when smaller). */
  thumbUrl: string;
  width: number;
  height: number;
  /** For example "CC BY-SA 4.0". */
  licence: string;
  licenceUrl: string | null;
  /** The author as Commons credits them, as plain text. */
  author: string;
  /** The file's page on Commons. */
  pageUrl: string;
}

interface ImageInfo {
  thumburl?: string;
  thumbwidth?: number;
  thumbheight?: number;
  url?: string;
  width?: number;
  height?: number;
  descriptionurl?: string;
  extmetadata?: Record<string, { value?: unknown } | undefined>;
}

/** Free licences an illustration may take a face reference from, with credit. GFDL-only and unknown licences are refused. */
const FREE_LICENCE = /^(cc0( 1\.0)?|public domain|pd(-[a-z0-9-]+)?|cc by(-sa)? \d\.\d( [a-z]{2,})?)$/i;

export function licenceAllowed(shortName: string): boolean {
  return FREE_LICENCE.test(shortName.trim());
}

/** Commons metadata is HTML; credits are plain text. */
export function plainText(html: unknown, max = 160): string {
  if (typeof html !== 'string') return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** The file's thumbnail, licence and author, or null when it is missing or not freely licensed. */
export async function commonsImage(file: string): Promise<CommonsImage | null> {
  const res = (await http(COMMONS_API, {
    action: 'query',
    titles: `File:${file}`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: '1024',
  })) as { query?: { pages?: { missing?: boolean; imageinfo?: ImageInfo[] }[] } };
  const info = res.query?.pages?.[0]?.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata ?? {};
  const licence = plainText(meta.LicenseShortName?.value, 60);
  if (!licence || !licenceAllowed(licence) || plainText(meta.NonFree?.value) === 'true') {
    logger.info({ file, licence }, 'commons_licence_refused');
    return null;
  }
  const thumbUrl = info.thumburl ?? info.url;
  if (!thumbUrl?.startsWith(COMMONS_UPLOADS) || !info.descriptionurl) return null;
  const licenceUrl = plainText(meta.LicenseUrl?.value, 300);
  return {
    thumbUrl,
    width: info.thumbwidth ?? info.width ?? 0,
    height: info.thumbheight ?? info.height ?? 0,
    licence,
    licenceUrl: /^https?:\/\//.test(licenceUrl) ? licenceUrl : null,
    author: plainText(meta.Artist?.value) || plainText(meta.Credit?.value) || 'Unknown author',
    pageUrl: info.descriptionurl.startsWith('//') ? `https:${info.descriptionurl}` : info.descriptionurl,
  };
}

/** Downloads a Commons thumbnail, with the same User-Agent. */
export function downloadCommonsImage(url: string): Promise<{ buffer: Buffer; width: number; height: number }> {
  return fetchRemoteImage(url, { allow: [COMMONS_UPLOADS], headers: { 'User-Agent': wikimediaUserAgent() }, timeoutMs: IMAGE_TIMEOUT_MS, maxBytes: 15 * 1024 * 1024 });
}
