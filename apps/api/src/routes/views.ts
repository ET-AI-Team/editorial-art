import type { BatchDto, BatchPlan, DirectionDto, OptionDto, OptionReference, PackAsset, PackDto, RequestDetail, RequestListItem, StyleRef } from '@editorial-art/shared-types';
import { BatchPlan as BatchPlanSchema } from '@editorial-art/shared-types';
import type { Batch, Brief, Direction, Option, PublishPack, Request, Style } from '@prisma/client';
import { excerpt } from '../lib/text';
import { orderByStory } from '../pipeline/story-check';

/** Database rows to the shapes in packages/shared-types. Kept in one place so routes stay thin. */

export function styleRef(style: Pick<Style, 'id' | 'slug' | 'label'>): StyleRef {
  return { id: style.id, slug: style.slug, label: style.label };
}

export function packDto(pack: PublishPack): PackDto {
  return {
    optionId: pack.optionId,
    status: pack.status,
    assets: pack.assets as unknown as PackAsset[],
    altText: pack.altText,
    caption: pack.caption,
    credit: pack.credit,
    createdAt: pack.createdAt.toISOString(),
  };
}

/** `refs` holds at least this option's references (see referencesByIds); one lookup serves a whole response. */
export function optionDto(o: Option & { pack: PublishPack | null }, styles: Map<string, Style>, refs: Map<string, OptionReference>): OptionDto {
  const style = styles.get(o.styleId);
  return {
    id: o.id,
    batchId: o.batchId,
    index: o.index,
    state: o.state,
    directionId: o.directionId,
    style: style ? styleRef(style) : { id: o.styleId, slug: 'unknown', label: 'Unknown' },
    previewUrl: o.previewUrl,
    finalUrl: o.finalUrl,
    picked: o.picked,
    blockedReason: o.blockedReason,
    failureReason: o.failureReason,
    pack: o.pack ? packDto(o.pack) : null,
    references: o.referenceIds.map((id) => refs.get(id)).filter((r): r is OptionReference => !!r),
    likenessWeak: o.likenessWeak,
    logoOk: o.logoOk,
  };
}

export type RequestWithEverything = Request & {
  briefs: (Brief & { directions: Direction[] })[];
  batches: (Batch & { options: (Option & { pack: PublishPack | null })[] })[];
};

export function requestDetail(r: RequestWithEverything, styles: Map<string, Style>, allowedStyleIds: string[], refs: Map<string, OptionReference>): RequestDetail {
  const brief = [...r.briefs].sort((a, b) => b.version - a.version)[0] ?? null;
  const directions: DirectionDto[] = (brief?.directions ?? [])
    .sort((a, b) => a.rank - b.rank)
    .map((d) => {
      const style = styles.get(d.suggestedStyleId);
      return {
        id: d.id,
        rank: d.rank,
        title: d.title,
        idea: d.idea,
        mustShow: d.mustShow,
        whyItFits: d.whyItFits,
        identityCues: d.identityCues,
        useLogo: d.useLogo,
        reason: d.reason,
        style: style ? styleRef(style) : { id: d.suggestedStyleId, slug: 'unknown', label: 'Unknown' },
      };
    });
  const batches: BatchDto[] = [...r.batches]
    .sort((a, b) => a.seq - b.seq)
    .map((b) => {
      const plan = BatchPlanSchema.safeParse(b.directionPlan);
      const style = b.styleId ? styles.get(b.styleId) : undefined;
      return {
        id: b.id,
        seq: b.seq,
        kind: b.kind,
        status: b.status,
        style: style ? styleRef(style) : null,
        promptDropped: plan.success ? (plan.data as BatchPlan).promptDropped : false,
        createdAt: b.createdAt.toISOString(),
        completedAt: b.completedAt?.toISOString() ?? null,
        // Best story and identity first; options without a story score keep their creation order after them.
        options: orderByStory(b.options).map((o) => optionDto(o, styles, refs)),
      };
    });
  return {
    requestId: r.publicId,
    status: r.status,
    failure: r.failureCode ? { code: r.failureCode, reason: r.failureReason ?? '' } : null,
    article: { title: r.articleTitle, chars: r.articleChars, lang: r.articleLang, excerpt: excerpt(r.articleExcerpt, 400) },
    prompt: r.prompt,
    brief: brief
      ? { headline: brief.headline, thesis: brief.thesis, tone: brief.tone, desk: brief.desk, sensitivity: { level: brief.sensitivity, reasons: brief.sensitivityReasons } }
      : null,
    directions,
    batches,
    allowedStyleIds,
    seriesOfRequestId: r.seriesOfRequestId,
    costInr: Math.round(Number(r.costInr) * 100) / 100,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export function listItem(r: Request & { options: Pick<Option, 'previewUrl' | 'finalUrl' | 'picked'>[] }): RequestListItem {
  const final = r.options.find((o) => o.picked && o.finalUrl);
  const firstPreview = r.options.find((o) => o.previewUrl);
  return {
    requestId: r.publicId,
    title: r.articleTitle,
    status: r.status,
    thumbUrl: final?.finalUrl ?? firstPreview?.previewUrl ?? null,
    pickedCount: r.options.filter((o) => o.picked).length,
    createdAt: r.createdAt.toISOString(),
  };
}
