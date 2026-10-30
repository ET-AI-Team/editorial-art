import type { BrandLogo } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { db } from '../lib/db';
import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { fold } from '../pipeline/guard/sensitivity';
import { providers } from '../providers';
import {
  claimValues,
  commonsImage,
  decide,
  downloadCommonsImage,
  entities,
  INDIA,
  itemIds,
  nameScore,
  nameTokens,
  onWikimediaReset,
  search,
  text,
  type Candidate,
  type Entity,
} from './wikimedia';

/**
 * The official logo of a story's main subject, when it is a company or brand: the Wikidata item's
 * logo image (P154) and that file on Wikimedia Commons, freely licensed only (public domain,
 * PD-textlogo, CC0, CC BY, CC BY-SA; see licenceAllowed). An SVG comes back as a PNG render.
 *
 * Found logos are kept in BrandLogo, so a brand is looked up once; an admin can retire one (it is
 * then never used, nor looked up again) or upload a replacement. Unsure or unreachable means no
 * logo: a missing logo never stops an article.
 */

const SEARCH_LIMIT = 10;
/** The logo copy we store and send: large enough to stay crisp on a hero object, never enlarged. */
const LOGO_SIDE = 1024;

export interface BrandMatch {
  wikidataId: string;
  label: string;
  /** The Commons file name from P154, without "File:". */
  logoFile: string;
}

function logoFile(entity: Entity): string | null {
  return claimValues(entity, 'P154').find((v): v is string => typeof v === 'string') ?? null;
}

function aliasesOf(entity: Entity): string[] {
  return [...(entity.aliases?.en ?? []), ...(entity.aliases?.hi ?? [])].map((a) => a.value);
}

function score(query: string, entity: Entity, rank: number, india: boolean): number {
  const name = nameScore(query, { label: text(entity.labels), aliases: aliasesOf(entity) });
  const inIndia = india && itemIds(entity, 'P17').includes(INDIA) ? 0.15 : 0;
  const fame = (Math.min(Object.keys(entity.sitelinks ?? {}).length, 40) / 40) * 0.1;
  const first = rank === 0 ? 0.05 : rank === 1 ? 0.02 : 0;
  return Math.round((name + inIndia + fame + first) * 1000) / 1000;
}

const words = (s: string) => nameTokens(s).join(' ');

/**
 * A holding company often has no logo of its own while the brand it owns does ("Jio Platforms"
 * owns "Jio"). Such a brand is used only when its name is one the company also goes by, or the
 * name the story used starts with it, so an unrelated subsidiary is never picked.
 */
function brandOf(query: string, company: Entity, owned: Entity[]): Entity | null {
  const names = new Set([text(company.labels), ...aliasesOf(company)].map(words).filter(Boolean));
  const asked = words(query);
  return (
    owned.find((e) => {
      if (!logoFile(e)) return false;
      const label = words(text(e.labels));
      return !!label && (names.has(label) || asked.startsWith(`${label} `));
    }) ?? null
  );
}

async function lookUp(name: string, india: boolean): Promise<BrandMatch | null> {
  const hits = await search(name, 'en');
  if (!hits.length) return null;
  const found = await entities(
    hits.slice(0, SEARCH_LIMIT).map((h) => h.id),
    'labels|aliases|claims|sitelinks'
  );
  const order = new Map(hits.map((h, i) => [h.id, i]));
  // Organisations and brands only: never a person.
  const orgs = found.filter((e) => e.missing === undefined && !itemIds(e, 'P31').includes('Q5'));
  const scored: Candidate[] = orgs.map((e) => ({ wikidataId: e.id, label: text(e.labels) || name, description: '', imageFile: logoFile(e) ?? '', score: score(name, e, order.get(e.id) ?? SEARCH_LIMIT, india) }));
  const best = decide(scored)?.best;
  if (!best) return null;
  const company = orgs.find((e) => e.id === best.wikidataId)!;
  const own = logoFile(company);
  if (own) return { wikidataId: company.id, label: text(company.labels) || name, logoFile: own };
  const ownedIds = [...itemIds(company, 'P355'), ...itemIds(company, 'P1830')].slice(0, 20);
  const brand = brandOf(name, company, await entities(ownedIds, 'labels|aliases|claims'));
  return brand ? { wikidataId: brand.id, label: text(brand.labels), logoFile: logoFile(brand)! } : null;
}

// ---- cache ---------------------------------------------------------------------------------

const TTL_MS = 6 * 60 * 60_000;
const MAX_ENTRIES = 300;
const cache = new Map<string, { at: number; value: Promise<BrandMatch | null> }>();
onWikimediaReset(() => cache.clear());

/** The brand a story most likely means, with a logo on Wikidata, or null when unsure or unreachable. */
export function resolveBrand(name: string, ctx: { india?: boolean } = {}): Promise<BrandMatch | null> {
  const key = `${words(name)}|${ctx.india ? 'in' : ''}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const value = lookUp(name, !!ctx.india).catch((err: unknown) => {
    logger.warn({ err: err instanceof Error ? err.message : String(err), name }, 'brand_lookup_failed');
    cache.delete(key);
    return null;
  });
  cache.set(key, { at: Date.now(), value });
  if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value!);
  return value;
}

// ---- the store -----------------------------------------------------------------------------

const key = (name: string) => fold(name).replace(/[^a-z0-9]+/g, ' ').trim();

/** A logo on file under this name or one of its aliases; a retired one wins, so a take-down holds. */
async function onFile(name: string): Promise<BrandLogo | 'retired' | null> {
  const k = key(name);
  if (!k) return null;
  const rows = await db.brandLogo.findMany({ orderBy: { updatedAt: 'desc' } });
  const named = rows.filter((r) => [r.name, ...r.aliases].some((n) => key(n) === k));
  if (named.some((r) => r.status === 'RETIRED')) return 'retired';
  return named.find((r) => r.status === 'ACTIVE') ?? null;
}

async function remember(logo: BrandLogo, name: string): Promise<BrandLogo> {
  if ([logo.name, ...logo.aliases].some((n) => key(n) === key(name))) return logo;
  return db.brandLogo.update({ where: { id: logo.id }, data: { aliases: [...logo.aliases, name.slice(0, 120)].slice(0, 20) } });
}

/** Copies a Commons logo to our storage as a PNG (transparency kept) and files it. */
async function store(match: BrandMatch, name: string): Promise<BrandLogo | null> {
  const image = await commonsImage(match.logoFile);
  if (!image) return null;
  const downloaded = await downloadCommonsImage(image.thumbUrl);
  const png = await sharp(downloaded.buffer).resize(LOGO_SIDE, LOGO_SIDE, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
  const id = randomUUID();
  const up = await providers().upload({ buffer: png, mimeType: 'image/png' }, { folder: `${env().EA_CLOUDINARY_FOLDER}/logos/${id}`, publicId: 'logo', format: 'png', tags: ['brand-logo'] });
  return db.brandLogo.create({
    data: {
      id,
      name: match.label.slice(0, 120),
      aliases: key(name) === key(match.label) ? [] : [name.slice(0, 120)],
      wikidataId: match.wikidataId,
      url: up.url,
      publicId: up.publicId,
      width: up.width,
      height: up.height,
      licence: image.licence,
      licenceUrl: image.licenceUrl,
      credit: image.author,
      commonsPage: image.pageUrl,
      source: 'WIKIMEDIA',
      status: 'ACTIVE',
    },
  });
}

/**
 * The official logo for a story's main subject: one on file by name, else the Wikidata match's
 * (filed once found). Null when there is none, it is not freely licensed, an admin retired it, or
 * anything fails on the way.
 */
export async function brandLogoFor(name: string, ctx: { india?: boolean } = {}): Promise<BrandLogo | null> {
  try {
    const known = await onFile(name);
    if (known === 'retired') return null;
    if (known) return known;
    const match = await resolveBrand(name, ctx);
    if (!match) return null;
    const filed = await db.brandLogo.findMany({ where: { wikidataId: match.wikidataId }, orderBy: { updatedAt: 'desc' } });
    if (filed.some((r) => r.status === 'RETIRED')) return null;
    const active = filed.find((r) => r.status === 'ACTIVE');
    if (active) return remember(active, name);
    return await store(match, name);
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err.message : String(err), name }, 'brand_logo_failed');
    return null;
  }
}
