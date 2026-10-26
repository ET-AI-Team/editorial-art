import type { StyleReferenceItem, StylesResponse } from '@editorial-art/shared-types';
import { Router } from 'express';
import { asyncRoute } from '../lib/async-route';
import { db } from '../lib/db';
import { ApiError } from '../lib/errors';
import { isUuid } from '../lib/ids';
import { liveStyles, styleBadges } from '../library/styles';

export const stylesRouter = Router();

let cache: { at: number; body: StylesResponse } | null = null;
const TTL_MS = 60_000;

/** Called after a publish or retire so the gallery shows the change at once. */
export function invalidateStylesCache(): void {
  cache = null;
}

/** LIVE styles grouped by family, with up to three cover images each (Step 7.6). */
stylesRouter.get(
  '/styles',
  asyncRoute(async (_req, res) => {
    if (cache && Date.now() - cache.at < TTL_MS) {
      res.json(cache.body);
      return;
    }
    const [styles, families] = await Promise.all([liveStyles(), db.styleFamily.findMany({ orderBy: { sortOrder: 'asc' } })]);
    const coverIds = styles.flatMap((s) => s.coverReferenceIds);
    const covers = new Map((await db.styleReference.findMany({ where: { id: { in: coverIds }, status: 'APPROVED' }, select: { id: true, url: true } })).map((r) => [r.id, r.url]));
    const body: StylesResponse = {
      families: families
        .map((f) => ({
          slug: f.slug as StylesResponse['families'][number]['slug'],
          label: f.label,
          styles: styles
            .filter((s) => s.familySlug === f.slug)
            .map((s) => ({
              id: s.id,
              slug: s.slug,
              label: s.label,
              summary: s.summary,
              goodFor: s.goodFor,
              badges: styleBadges(s),
              covers: s.coverReferenceIds.map((id) => covers.get(id)).filter((u): u is string => !!u).slice(0, 3),
              safety: s.safety,
            })),
        }))
        .filter((f) => f.styles.length > 0),
    };
    cache = { at: Date.now(), body };
    res.json(body);
  })
);

/**
 * Every approved reference of a LIVE style, so editors can browse a style fully before choosing
 * it (and pin one), with the artist and the page it was published on.
 */
stylesRouter.get(
  '/styles/:styleId/references',
  asyncRoute(async (req, res) => {
    const id = req.params.styleId;
    if (!id || !isUuid(id)) throw ApiError.notFound('Style not found.');
    const style = await db.style.findFirst({ where: { id, status: 'LIVE' }, select: { id: true } });
    if (!style) throw ApiError.notFound('Style not found.');
    const rows = await db.styleReference.findMany({
      where: { styleId: id, status: 'APPROVED' },
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
