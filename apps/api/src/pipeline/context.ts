import type { BatchPlanEntry, SentImage } from '@editorial-art/shared-types';
import { BatchPlan, ReadHook } from '@editorial-art/shared-types';
import { db } from '../lib/db';
import { styleById, type StyleView } from '../library/styles';
import { providers, type ImageData } from '../providers';
import type { PeopleEntry } from './read';

/** Everything a preview or a final needs about one option, loaded once. */
export interface OptionContext {
  option: NonNullable<Awaited<ReturnType<typeof loadOption>>>;
  request: { id: string; publicId: string; status: string; prompt: string | null; actorUserId: string; title: string | null };
  batch: { id: string; status: string; promptDropped: boolean };
  /** `hook` is null for briefs read before it existed. */
  brief: { tone: string; desk: string; thesis: string; altTextSeed: string; headline: string; hook: ReadHook | null };
  direction: { id: string; title: string; idea: string; avoid: string[]; peopleDepicted: PeopleEntry[]; mustShow: string[] };
  style: StyleView;
  entry: BatchPlanEntry;
  likenessNames: string[];
}

function loadOption(optionId: string) {
  return db.option.findUnique({ where: { id: optionId }, include: { batch: true, request: true } });
}

export async function loadOptionContext(optionId: string): Promise<OptionContext | null> {
  const option = await loadOption(optionId);
  if (!option) return null;
  const [direction, style, brief] = await Promise.all([
    db.direction.findUnique({ where: { id: option.directionId } }),
    styleById(option.styleId),
    db.brief.findFirst({ where: { requestId: option.requestId }, orderBy: { version: 'desc' } }),
  ]);
  if (!direction || !style || !brief) return null;
  const plan = BatchPlan.parse(option.batch.directionPlan);
  const entry = plan.entries.find((e) => e.index === option.index)!;
  const likenesses = entry.likenessIds.length ? await db.likeness.findMany({ where: { id: { in: entry.likenessIds }, status: 'ACTIVE' } }) : [];
  return {
    option,
    request: { id: option.request.id, publicId: option.request.publicId, status: option.request.status, prompt: option.request.prompt, actorUserId: option.request.actorUserId, title: option.request.articleTitle },
    batch: { id: option.batch.id, status: option.batch.status, promptDropped: plan.promptDropped },
    brief: { tone: brief.tone, desk: brief.desk, thesis: brief.thesis, altTextSeed: brief.altTextSeed, headline: brief.headline, hook: ReadHook.safeParse(brief.hook).data ?? null },
    direction: { id: direction.id, title: direction.title, idea: direction.idea, avoid: direction.avoid, peopleDepicted: direction.peopleDepicted as unknown as PeopleEntry[], mustShow: direction.mustShow },
    style,
    entry,
    likenessNames: likenesses.map((l) => l.name),
  };
}

/** Short-lived cache so a batch of four does not download the same reference four times. */
const cache = new Map<string, { at: number; image: Promise<ImageData> }>();
const TTL_MS = 10 * 60_000;

export function fetchCached(url: string, maxWidth = 1024): Promise<ImageData> {
  const key = `${maxWidth}:${url}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.image;
  const image = providers().fetchImage(url, maxWidth);
  cache.set(key, { at: Date.now(), image });
  image.catch(() => cache.delete(key));
  if (cache.size > 200) {
    for (const [k, v] of cache) if (Date.now() - v.at >= TTL_MS) cache.delete(k);
  }
  return image;
}

/**
 * Style references are fetched larger than other inputs so grain and texture survive the trip:
 * at most this wide (library images are stored at most 1,600 wide), never enlarged.
 */
export const REFERENCE_MAX_WIDTH = 1280;

export interface InputImages {
  images: ImageData[];
  /** Where each image came from, in the same order: what the audit trail records. */
  sources: SentImage[];
  refCount: number;
  likenessPhotoCount: number;
  series: boolean;
}

/** Reference images, likeness photos and (for a series) the earlier final, in prompt order. */
export async function inputImages(ctx: OptionContext): Promise<InputImages> {
  const refs = await db.styleReference.findMany({ where: { id: { in: ctx.option.referenceIds } }, select: { id: true, url: true } });
  const ordered = ctx.option.referenceIds.map((id) => refs.find((r) => r.id === id)).filter((r): r is { id: string; url: string } => !!r);
  const refImages = await Promise.all(ordered.map((r) => fetchCached(r.url, REFERENCE_MAX_WIDTH)));

  const likenesses = ctx.entry.likenessIds.length ? await db.likeness.findMany({ where: { id: { in: ctx.entry.likenessIds }, status: 'ACTIVE' } }) : [];
  const photoUrls = likenesses.flatMap((l) => (l.photos as { url: string }[]).slice(0, 2).map((p) => p.url));
  const photos = await Promise.all(photoUrls.map((u) => fetchCached(u, 768)));

  let series: { url: string; image: ImageData } | null = null;
  if (ctx.entry.seriesSourceOptionId) {
    const source = await db.option.findUnique({ where: { id: ctx.entry.seriesSourceOptionId }, select: { finalUrl: true } });
    if (source?.finalUrl) series = { url: source.finalUrl, image: await fetchCached(source.finalUrl, 1024) };
  }
  return {
    images: [...refImages, ...photos, ...(series ? [series.image] : [])],
    sources: [
      ...ordered.map((r) => ({ role: 'reference' as const, url: r.url })),
      ...photoUrls.map((url) => ({ role: 'likeness' as const, url })),
      ...(series ? [{ role: 'series' as const, url: series.url }] : []),
    ],
    refCount: refImages.length,
    likenessPhotoCount: photos.length,
    series: !!series,
  };
}
