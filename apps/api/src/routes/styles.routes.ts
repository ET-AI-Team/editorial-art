import type { StyleReferenceItem, StylesResponse } from '@editorial-art/shared-types';
import { Router } from 'express';
import { asyncRoute } from '../lib/async-route';
import { db } from '../lib/db';
import { ApiError } from '../lib/errors';
import { isUuid } from '../lib/ids';
import { styleBadges, toStyleView } from '../library/styles';

export const stylesRouter = Router();

let cache: { at: number; body: StylesResponse } | null = null;
const TTL_MS = 60_000;

/** Called after a publish or retire so the gallery shows the change at once. */
export function invalidateStylesCache(): void {
  cache = null;
}

/**
 * References the public gallery may show for a style: approved ones, and never the old generated
 * exemplars of a style that is not LIVE (it is being rebuilt from the artist library).
 */
function visibleReferences(styleId: string, live: boolean) {
  return { styleId, status: 'APPROVED' as const, ...(live ? {} : { source: { not: 'GENERATED' as const } }) };
}

/**
 * Every family with every style that is not retired (Step 7.6). A family with none, such as one
 * of an earlier library whose styles are all retired, is left out. Only LIVE styles are `available`;
 * the others show what references they have so far, so the whole library can be browsed while
 * it fills in. Up to three covers each: the chosen covers, else the most picked references.
 */
stylesRouter.get(
  '/styles',
  asyncRoute(async (_req, res) => {
    if (cache && Date.now() - cache.at < TTL_MS) {
      res.json(cache.body);
      return;
    }
    const [rows, families] = await Promise.all([
      db.style.findMany({ where: { status: { not: 'RETIRED' } }, include: { family: true }, orderBy: [{ sortOrder: 'asc' }] }),
      db.styleFamily.findMany({ orderBy: { sortOrder: 'asc' } }),
    ]);
    const styles = rows.map(toStyleView);
    const refs = await db.styleReference.findMany({
      where: { OR: styles.map((s) => visibleReferences(s.id, s.status === 'LIVE')) },
      orderBy: [{ pickCount: 'desc' }, { createdAt: 'asc' }],
      select: { id: true, url: true, styleId: true },
    });
    const byStyle = new Map<string, { id: string; url: string }[]>();
    for (const r of refs) byStyle.set(r.styleId, [...(byStyle.get(r.styleId) ?? []), r]);
    const card = (s: (typeof styles)[number]): StylesResponse['families'][number]['styles'][number] => {
      const own = byStyle.get(s.id) ?? [];
      const chosen = s.coverReferenceIds.map((id) => own.find((r) => r.id === id)?.url).filter((u): u is string => !!u);
      return {
        id: s.id,
        slug: s.slug,
        label: s.label,
        summary: s.summary,
        goodFor: s.goodFor,
        badges: styleBadges(s),
        covers: (chosen.length ? chosen : own.map((r) => r.url)).slice(0, 3),
        safety: s.safety,
        available: s.status === 'LIVE',
        referenceCount: own.length,
      };
    };
    const body: StylesResponse = {
      families: families
        .map((f) => ({ slug: f.slug, label: f.label, styles: styles.filter((s) => s.familySlug === f.slug).map(card) }))
        .filter((f) => f.styles.length > 0),
    };
    cache = { at: Date.now(), body };
    res.json(body);
  })
);

/**
 * Every approved reference of a style that is not retired, so editors can browse a style fully
 * before choosing it (and pin one), with the artist and the page it was published on. A style
 * that is not LIVE yet returns what it has so far, possibly nothing.
 */
stylesRouter.get(
  '/styles/:styleId/references',
  asyncRoute(async (req, res) => {
    const id = req.params.styleId;
    if (!id || !isUuid(id)) throw ApiError.notFound('Style not found.');
    const style = await db.style.findFirst({ where: { id, status: { not: 'RETIRED' } }, select: { id: true, status: true } });
    if (!style) throw ApiError.notFound('Style not found.');
    const rows = await db.styleReference.findMany({
      where: visibleReferences(id, style.status === 'LIVE'),
      orderBy: [{ artist: { name: 'asc' } }, { pickCount: 'desc' }, { createdAt: 'asc' }],
      select: { id: true, url: true, width: true, height: true, sourceUrl: true, artist: { select: { name: true, portfolioUrl: true } } },
    });
    const items: StyleReferenceItem[] = rows
      .map((r) => ({
        id: r.id,
        url: r.url,
        width: r.width,
        height: r.height,
        artist: r.artist ? { name: r.artist.name, url: r.artist.portfolioUrl } : null,
        sourceUrl: r.sourceUrl,
      }))
      // References without an artist go last.
      .sort((a, b) => Number(a.artist === null) - Number(b.artist === null));
    res.json({ items });
  })
);
