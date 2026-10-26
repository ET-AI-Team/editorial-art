import { z } from 'zod';
import { Id, Iso, PublicRequestId, SensitivityLevel, safeText } from './common';
import { BatchKind, BatchStatus, OptionState, PackSize, PackStatus, RequestStatus } from './states';
import { FamilySlug, RuleSheet, StyleSafety } from './style';

/** Limits on what a person can send. The article limits apply after normalisation. */
export const ARTICLE_MIN_CHARS = 300;
export const ARTICLE_MAX_CHARS = 40_000;
export const PROMPT_MAX_CHARS = 2_000;
export const TITLE_MAX_CHARS = 300;

export const StyleRef = z.object({ id: Id, slug: z.string(), label: z.string() });
export type StyleRef = z.infer<typeof StyleRef>;

// ---- requests ------------------------------------------------------------------------------

export const CreateRequestBody = z
  .object({
    articleText: safeText(ARTICLE_MIN_CHARS, ARTICLE_MAX_CHARS),
    articleTitle: safeText(1, TITLE_MAX_CHARS).optional(),
    prompt: safeText(1, PROMPT_MAX_CHARS).optional().nullable(),
    styleId: Id.optional().nullable(),
    /** An approved reference of `styleId`: every option of the first batch is made from it. */
    pinnedReferenceId: Id.optional().nullable(),
    seriesOfRequestId: PublicRequestId.optional().nullable(),
    clientRef: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,100}$/, 'clientRef may use letters, digits, _ and - only')
      .optional(),
  })
  .strict();
export type CreateRequestBody = z.infer<typeof CreateRequestBody>;

export const CreateRequestResponse = z.object({ requestId: PublicRequestId, status: RequestStatus, createdAt: Iso });
export type CreateRequestResponse = z.infer<typeof CreateRequestResponse>;

// ---- pack and options ----------------------------------------------------------------------

export const PackAsset = z.object({
  size: PackSize,
  width: z.number().int(),
  height: z.number().int(),
  webpUrl: z.string().url(),
  jpgUrl: z.string().url(),
  bytes: z.object({ webp: z.number().int(), jpg: z.number().int() }),
  method: z.enum(['resize']),
});
export type PackAsset = z.infer<typeof PackAsset>;

export const PackDto = z.object({
  optionId: Id,
  status: PackStatus,
  assets: z.array(PackAsset),
  altText: z.string(),
  caption: z.string(),
  credit: z.string(),
  createdAt: Iso,
});
export type PackDto = z.infer<typeof PackDto>;

export const OptionDto = z.object({
  id: Id,
  batchId: Id,
  index: z.number().int().min(0).max(3),
  state: OptionState,
  directionId: Id,
  style: StyleRef,
  previewUrl: z.string().url().nullable(),
  finalUrl: z.string().url().nullable(),
  picked: z.boolean(),
  blockedReason: z.string().nullable(),
  failureReason: z.string().nullable(),
  pack: PackDto.nullable(),
});
export type OptionDto = z.infer<typeof OptionDto>;

// ---- request detail ------------------------------------------------------------------------

export const DirectionDto = z.object({
  id: Id,
  rank: z.number().int(),
  title: z.string(),
  idea: z.string(),
  style: StyleRef,
  reason: z.string(),
});
export type DirectionDto = z.infer<typeof DirectionDto>;

export const BatchDto = z.object({
  id: Id,
  seq: z.number().int(),
  kind: BatchKind,
  status: BatchStatus,
  style: StyleRef.nullable(),
  promptDropped: z.boolean(),
  createdAt: Iso,
  completedAt: Iso.nullable(),
  options: z.array(OptionDto),
});
export type BatchDto = z.infer<typeof BatchDto>;

export const RequestDetail = z.object({
  requestId: PublicRequestId,
  status: RequestStatus,
  failure: z.object({ code: z.string(), reason: z.string() }).nullable(),
  article: z.object({
    title: z.string().nullable(),
    chars: z.number().int(),
    lang: z.string(),
    excerpt: z.string().max(400),
  }),
  prompt: z.string().nullable(),
  brief: z
    .object({
      headline: z.string(),
      thesis: z.string(),
      tone: z.string(),
      desk: z.string(),
      sensitivity: z.object({ level: SensitivityLevel, reasons: z.array(z.string()) }),
    })
    .nullable(),
  directions: z.array(DirectionDto),
  batches: z.array(BatchDto),
  allowedStyleIds: z.array(Id),
  seriesOfRequestId: PublicRequestId.nullable(),
  costInr: z.number(),
  createdAt: Iso,
  updatedAt: Iso,
});
export type RequestDetail = z.infer<typeof RequestDetail>;

export const RequestListItem = z.object({
  requestId: PublicRequestId,
  title: z.string().nullable(),
  status: RequestStatus,
  thumbUrl: z.string().url().nullable(),
  pickedCount: z.number().int(),
  createdAt: Iso,
});
export type RequestListItem = z.infer<typeof RequestListItem>;

export const RequestListResponse = z.object({ items: z.array(RequestListItem), nextCursor: z.string().nullable() });
export type RequestListResponse = z.infer<typeof RequestListResponse>;

export const RequestListQuery = z
  .object({
    cursor: z.string().max(200).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const ArticleTextResponse = z.object({ title: z.string().nullable(), text: z.string() });

// ---- batches -------------------------------------------------------------------------------

export const CreateBatchBody = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('MORE'), fromOptionId: Id.optional(), fromBatchId: Id.optional() }).strict(),
  z.object({ kind: z.literal('ANOTHER_STYLE'), styleId: Id, pinnedReferenceId: Id.optional() }).strict(),
  z.object({ kind: z.literal('SERIES_MATCH'), seriesOfRequestId: PublicRequestId }).strict(),
]);
export type CreateBatchBody = z.infer<typeof CreateBatchBody>;

export const CreateBatchResponse = z.object({ batchId: Id, seq: z.number().int(), status: BatchStatus });
export type CreateBatchResponse = z.infer<typeof CreateBatchResponse>;

export const FinalizeResponse = z.object({ optionId: Id, state: OptionState });

// ---- styles --------------------------------------------------------------------------------

export const StyleCard = z.object({
  id: Id,
  slug: z.string(),
  label: z.string(),
  summary: z.string(),
  goodFor: z.array(z.string()),
  badges: z.array(z.string()),
  covers: z.array(z.string().url()).max(3),
  safety: StyleSafety,
  /** True only when the style is LIVE: editors can browse other styles but not use them yet. */
  available: z.boolean(),
  /** Approved references the gallery can show. */
  referenceCount: z.number().int().min(0),
});
export type StyleCard = z.infer<typeof StyleCard>;

/** Every family, in order, with every style that is not retired, available or not. */
export const StylesResponse = z.object({
  families: z.array(z.object({ slug: FamilySlug, label: z.string(), styles: z.array(StyleCard) })),
});
export type StylesResponse = z.infer<typeof StylesResponse>;

export const StyleReferenceItem = z.object({
  id: Id,
  url: z.string().url(),
  width: z.number().int(),
  height: z.number().int(),
  /** Who made it and where it is published; null for references without an artist. */
  artist: z.object({ name: z.string(), url: z.string().url() }).nullable(),
  sourceUrl: z.string().url().nullable(),
});
export type StyleReferenceItem = z.infer<typeof StyleReferenceItem>;

/** Grouped by artist (by name, references without an artist last), most picked first within each. */
export const StyleReferencesResponse = z.object({ items: z.array(StyleReferenceItem) });
export type StyleReferencesResponse = z.infer<typeof StyleReferencesResponse>;

// ---- admin ---------------------------------------------------------------------------------

export const ReviewReferenceBody = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    note: z.string().max(300).optional(),
    reasonChip: z.enum(['off-style', 'quality', 'text', 'anatomy', 'other']).optional(),
  })
  .strict();
export type ReviewReferenceBody = z.infer<typeof ReviewReferenceBody>;

export const BulkReviewBody = z
  .object({
    ids: z.array(Id).min(1).max(200),
    decision: z.enum(['APPROVED', 'REJECTED']),
    note: z.string().max(300).optional(),
  })
  .strict();

export const GenerateExemplarsBody = z
  .object({
    subjects: z.array(z.string().min(3).max(160)).min(1).max(30).optional(),
    useApprovedAsRefs: z.boolean(),
  })
  .strict();
export type GenerateExemplarsBody = z.infer<typeof GenerateExemplarsBody>;

export const PatchStyleBody = z
  .object({
    summary: z.string().min(5).max(160).optional(),
    ruleSheet: RuleSheet.optional(),
    goodFor: z.array(z.string().min(2).max(40)).min(1).max(12).optional(),
    safety: StyleSafety.optional(),
    sortOrder: z.number().int().optional(),
    coverReferenceIds: z.array(Id).max(3).optional(),
  })
  .strict();

export const LikenessBody = z
  .object({
    name: z.string().min(1).max(120),
    aliases: z.array(z.string().min(1).max(120)).max(10),
    consentNote: z.string().min(5).max(500),
  })
  .strict();

export const AdminStyleRow = z.object({
  id: Id,
  slug: z.string(),
  label: z.string(),
  familySlug: FamilySlug,
  status: z.enum(['DRAFT', 'CURATING', 'LIVE', 'RETIRED']),
  summary: z.string(),
  goodFor: z.array(z.string()),
  safety: StyleSafety,
  ruleSheet: RuleSheet,
  counts: z.object({ candidate: z.number().int(), approved: z.number().int(), rejected: z.number().int() }),
  minApprovedRefs: z.number().int(),
  coverReferenceIds: z.array(Id),
  sortOrder: z.number().int(),
});
export type AdminStyleRow = z.infer<typeof AdminStyleRow>;

export const AdminReference = z.object({
  id: Id,
  styleId: Id,
  source: z.enum(['GENERATED', 'ET_ARCHIVE', 'LICENSED', 'ARTIST']),
  url: z.string().url(),
  width: z.number().int(),
  height: z.number().int(),
  description: z.string(),
  subjects: z.array(z.string()),
  mood: z.string(),
  status: z.enum(['CANDIDATE', 'APPROVED', 'REJECTED', 'RETIRED']),
  screen: z
    .object({ passed: z.boolean(), reason: z.string() })
    .nullable(),
  reviewNote: z.string().nullable(),
  usageCount: z.number().int(),
  pickCount: z.number().int(),
  createdAt: Iso,
});
export type AdminReference = z.infer<typeof AdminReference>;

export const SpendSummary = z.object({
  todayInr: z.number(),
  dailyCapInr: z.number().nullable(),
  monthInr: z.number(),
  buildInr: z.number().nullable(),
  buildCapInr: z.number().nullable(),
});
export type SpendSummary = z.infer<typeof SpendSummary>;

// ---- errors --------------------------------------------------------------------------------

export const ErrorBody = z.object({
  error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional() }),
});
export type ErrorBody = z.infer<typeof ErrorBody>;
