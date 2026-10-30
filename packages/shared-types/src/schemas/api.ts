import { z } from 'zod';
import { Id, Iso, PublicRequestId, SensitivityLevel, safeText } from './common';
import { BatchKind, BatchStatus, OptionState, PackSize, PackStatus, RequestStatus } from './states';
import { RuleSheet, StyleSafety } from './style';

/** Limits on what a person can send. The article limits apply after normalisation. */
export const ARTICLE_MIN_CHARS = 300;
export const ARTICLE_MAX_CHARS = 40_000;
export const PROMPT_MAX_CHARS = 2_000;
export const TITLE_MAX_CHARS = 300;

export const StyleRef = z.object({ id: Id, slug: z.string(), label: z.string() });
export type StyleRef = z.infer<typeof StyleRef>;

/** At most this many references go with each image. */
export const MAX_CHOSEN_REFERENCES = 3;

/**
 * References the editor chose for a batch: 1 to 3 distinct approved references of the batch's
 * style, sent with every option in this order instead of the automatic pick.
 */
export const ChosenReferenceIds = z
  .array(Id)
  .min(1, 'choose at least one reference')
  .max(MAX_CHOSEN_REFERENCES, `choose at most ${MAX_CHOSEN_REFERENCES} references`)
  .refine((ids) => new Set(ids).size === ids.length, 'each reference may be chosen once');
export type ChosenReferenceIds = z.infer<typeof ChosenReferenceIds>;

// ---- requests ------------------------------------------------------------------------------

export const CreateRequestBody = z
  .object({
    articleText: safeText(ARTICLE_MIN_CHARS, ARTICLE_MAX_CHARS),
    articleTitle: safeText(1, TITLE_MAX_CHARS).optional(),
    prompt: safeText(1, PROMPT_MAX_CHARS).optional().nullable(),
    styleId: Id.optional().nullable(),
    /** An approved reference of `styleId`: every option of the first batch is made from it. */
    pinnedReferenceId: Id.optional().nullable(),
    /** Approved references of `styleId` sent with every option, in order. Not with `pinnedReferenceId`. */
    referenceIds: ChosenReferenceIds.optional().nullable(),
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

// ---- photo advice --------------------------------------------------------------------------

/** Why a story may be better served by a real photo; 'none' when an illustration fits. */
export const PHOTO_ADVICE_KINDS = ['breaking', 'real-person', 'event-place', 'sports', 'obituary', 'legal', 'none'] as const;
export const PhotoAdviceKind = z.enum(PHOTO_ADVICE_KINDS);
export type PhotoAdviceKind = z.infer<typeof PhotoAdviceKind>;
export const PHOTO_ADVICE_REASON_MAX = 160;

/** Asked before a request is created; nothing is stored. */
export const PhotoAdviceBody = z
  .object({
    title: safeText(1, TITLE_MAX_CHARS).optional(),
    text: safeText(1, ARTICLE_MAX_CHARS),
  })
  .strict();
export type PhotoAdviceBody = z.infer<typeof PhotoAdviceBody>;

export const PhotoAdviceResponse = z
  .object({
    suggestPhoto: z.boolean(),
    reason: z.string().max(PHOTO_ADVICE_REASON_MAX),
    kind: PhotoAdviceKind,
  })
  .strict();
export type PhotoAdviceResponse = z.infer<typeof PhotoAdviceResponse>;

// ---- pack and options ----------------------------------------------------------------------

export const PackAsset = z.object({
  size: PackSize,
  width: z.number().int(),
  height: z.number().int(),
  webpUrl: z.string().url(),
  jpgUrl: z.string().url(),
  /** The lossless master. Packs made before masters were kept have none. */
  pngUrl: z.string().url().optional(),
  bytes: z.object({ webp: z.number().int(), jpg: z.number().int(), png: z.number().int().optional() }),
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

/** A reference image sent to the image model with an option. */
export const OptionReference = z.object({
  id: Id,
  url: z.string().url(),
  /** Null for references without an artist. */
  artist: z.object({ name: z.string(), url: z.string().url() }).nullable(),
});
export type OptionReference = z.infer<typeof OptionReference>;

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
  /** The references sent to the image model, in the order they were sent. */
  references: z.array(OptionReference),
  /** A real person's face still looked unlike their reference photos after one redraw. */
  likenessWeak: z.boolean(),
});
export type OptionDto = z.infer<typeof OptionDto>;

// ---- request detail ------------------------------------------------------------------------

export const DirectionDto = z.object({
  id: Id,
  rank: z.number().int(),
  title: z.string(),
  idea: z.string(),
  /** What the image must show, tied to this story. Empty for directions read before it existed. */
  mustShow: z.array(z.string()),
  /** One line on how the image tells the story. Empty for directions read before it existed. */
  whyItFits: z.string(),
  /** Which of the main subject's identity cues the idea shows. Empty when none fit, or for directions read before it existed. */
  identityCues: z.array(z.string()),
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
  z.object({ kind: z.literal('ANOTHER_STYLE'), styleId: Id, pinnedReferenceId: Id.optional(), referenceIds: ChosenReferenceIds.optional() }).strict(),
  z.object({ kind: z.literal('SERIES_MATCH'), seriesOfRequestId: PublicRequestId }).strict(),
]);
export type CreateBatchBody = z.infer<typeof CreateBatchBody>;

export const CreateBatchResponse = z.object({ batchId: Id, seq: z.number().int(), status: BatchStatus });
export type CreateBatchResponse = z.infer<typeof CreateBatchResponse>;

export const FinalizeResponse = z.object({ optionId: Id, state: OptionState });

// ---- real people ---------------------------------------------------------------------------

/**
 * What an editor does with one real person found in a story: use the photo shown, try the next
 * match, use a photo they uploaded (a URL from AI Studio's own upload), or show the person
 * without a face. Only for actors the EA_REAL_PEOPLE gate allows.
 */
export const PEOPLE_ACTIONS = ['use', 'swap', 'symbolic', 'upload'] as const;
export const PeopleAction = z.enum(PEOPLE_ACTIONS);
export type PeopleAction = z.infer<typeof PeopleAction>;

export const PeopleDecisionBody = z
  .object({
    action: PeopleAction,
    /** `upload` only: an https image URL on res.cloudinary.com. */
    url: z.string().url().max(2000).optional(),
  })
  .strict()
  .refine((b) => b.action !== 'upload' || Boolean(b.url), { message: 'upload needs a url', path: ['url'] })
  .refine((b) => b.action === 'upload' || !b.url, { message: 'only upload takes a url', path: ['url'] });
export type PeopleDecisionBody = z.infer<typeof PeopleDecisionBody>;

export const PersonDecision = z.enum(['PENDING', 'USE', 'UPLOAD', 'SYMBOLIC']);
export type PersonDecision = z.infer<typeof PersonDecision>;
export const LikenessSource = z.enum(['ADMIN', 'WIKIMEDIA', 'UPLOAD']);
export type LikenessSource = z.infer<typeof LikenessSource>;

/** One person the read found, with the photo on offer. */
export const PersonCard = z.object({
  likenessId: Id,
  /** As the story names them. */
  name: z.string(),
  /** What the story says they are, when the read said. */
  role: z.string(),
  /** The name the photo is filed under (Wikidata's label for a Commons photo). */
  label: z.string(),
  /** A short description, for example "Indian businessman". */
  description: z.string().nullable(),
  photoUrl: z.string().url().nullable(),
  source: LikenessSource,
  /** "Wikimedia Commons, CC BY-SA 4.0" for a Commons photo; null otherwise. */
  sourceLine: z.string().nullable(),
  /** Who took the photo, as Commons credits them. */
  author: z.string().nullable(),
  /** The Commons file page. */
  sourcePage: z.string().url().nullable(),
  decision: PersonDecision,
  /** Whether "Try another" has another match to offer. */
  canSwap: z.boolean(),
});
export type PersonCard = z.infer<typeof PersonCard>;

export const PeopleResponse = z.object({
  status: RequestStatus,
  /** True while the request waits for these decisions. */
  waiting: z.boolean(),
  people: z.array(PersonCard),
});
export type PeopleResponse = z.infer<typeof PeopleResponse>;

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

/**
 * Every family that has a style that is not retired, in order, with each of those styles,
 * available or not. The slug is usually one of FAMILY_SLUGS, but a family of an earlier library
 * still holding a style that is not retired comes back under its stored slug, so it is a string.
 */
export const StylesResponse = z.object({
  families: z.array(z.object({ slug: z.string(), label: z.string(), styles: z.array(StyleCard) })),
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
  /** A string, not FamilySlug: retired styles keep the family of the library they came from. */
  familySlug: z.string(),
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

// ---- image model setting (admin) -----------------------------------------------------------

/** The image models an admin may choose. Each belongs to one provider. */
export const IMAGE_MODEL_IDS = ['gemini-3.1-flash-image', 'gemini-3-pro-image', 'gpt-image-2'] as const;
export const ImageModelId = z.enum(IMAGE_MODEL_IDS);
export type ImageModelId = z.infer<typeof ImageModelId>;

export const ImageProvider = z.enum(['gemini', 'openai']);
export type ImageProvider = z.infer<typeof ImageProvider>;

export const ImageModelOption = z.object({
  id: ImageModelId,
  label: z.string(),
  provider: ImageProvider,
  speed: z.enum(['fast', 'standard']),
  note: z.string(),
});
export type ImageModelOption = z.infer<typeof ImageModelOption>;

export const IMAGE_MODEL_OPTIONS: readonly ImageModelOption[] = [
  { id: 'gemini-3.1-flash-image', label: 'Gemini 3.1 Flash Image', provider: 'gemini', speed: 'fast', note: 'Fast and cheap. The default for previews.' },
  { id: 'gemini-3-pro-image', label: 'Gemini 3 Pro Image', provider: 'gemini', speed: 'standard', note: 'Slower, more detailed. The default for finals.' },
  { id: 'gpt-image-2', label: 'GPT Image 2', provider: 'openai', speed: 'standard', note: 'OpenAI. Slower; a good second opinion on style.' },
];

/** The provider of a model id: a listed one by the table, any other (a dated id, say) by its name. */
export function providerOfModel(model: string): ImageProvider {
  return IMAGE_MODEL_OPTIONS.find((o) => o.id === model)?.provider ?? (model.startsWith('gpt-') ? 'openai' : 'gemini');
}

/** Output resolution of an image call: 1K is about 1024 px square, 2K about 2048, 4K the largest. */
export const ImageSize = z.enum(['1K', '2K', '4K']);
export type ImageSize = z.infer<typeof ImageSize>;
/** Finals are never smaller than 2K. */
export const FinalImageSize = z.enum(['2K', '4K']);
export type FinalImageSize = z.infer<typeof FinalImageSize>;

export const ImageModelSetting = z.object({ previewModel: ImageModelId, finalModel: ImageModelId, finalImageSize: FinalImageSize });
export type ImageModelSetting = z.infer<typeof ImageModelSetting>;

export const ImageModelSettingResponse = ImageModelSetting.extend({ options: z.array(ImageModelOption) });
export type ImageModelSettingResponse = z.infer<typeof ImageModelSettingResponse>;

export const PutImageModelSettingBody = z
  .object({ previewModel: ImageModelId.optional(), finalModel: ImageModelId.optional(), finalImageSize: FinalImageSize.optional() })
  .strict()
  .refine((b) => b.previewModel !== undefined || b.finalModel !== undefined || b.finalImageSize !== undefined, 'set previewModel, finalModel or finalImageSize');
export type PutImageModelSettingBody = z.infer<typeof PutImageModelSettingBody>;

// ---- usage analytics (admin) ---------------------------------------------------------------

/** The longest range GET /admin/stats accepts, and the range it uses when none is given. */
export const ADMIN_STATS_MAX_DAYS = 366;
export const ADMIN_STATS_DEFAULT_DAYS = 30;

/** `from` and `to` are ISO instants (any offset); `from` is inclusive and `to` exclusive. Either may be left out. */
export const AdminStatsQuery = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});
export type AdminStatsQuery = z.infer<typeof AdminStatsQuery>;

const Count = z.number().int().nonnegative();
const Inr = z.number();
/** 0 to 1, or null when there is nothing to divide by. */
const Rate = z.number().min(0).max(1).nullable();

export const AdminStatsResponse = z.object({
  range: z.object({ from: Iso, to: Iso }),
  totals: z.object({
    requests: Count,
    batches: Count,
    previews: Count,
    previewsFailed: Count,
    finals: Count,
    finalsFailed: Count,
    costInr: Inr,
    avgFirstPreviewSec: z.number().nullable(),
    avgFinalSec: z.number().nullable(),
  }),
  /** One row per Asia/Kolkata day in the range, oldest first, zeros included. */
  daily: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      requests: Count,
      batches: Count,
      finals: Count,
      costInr: Inr,
    })
  ),
  costByStage: z.array(z.object({ stage: z.string(), calls: Count, costInr: Inr })),
  costByModel: z.array(
    z.object({
      model: z.string(),
      provider: z.string(),
      calls: Count,
      costInr: Inr,
      p50Ms: z.number().nullable(),
      p90Ms: z.number().nullable(),
    })
  ),
  byUser: z.array(z.object({ actorUserId: z.string(), requests: Count, batches: Count, finals: Count, costInr: Inr })),
  /** Every style that is not retired, zeros included. */
  styles: z.array(
    z.object({
      styleId: Id,
      slug: z.string(),
      label: z.string(),
      familySlug: z.string(),
      familyLabel: z.string(),
      status: z.enum(['DRAFT', 'CURATING', 'LIVE', 'RETIRED']),
      batches: Count,
      picks: Count,
      finals: Count,
      costInr: Inr,
    })
  ),
  quality: z.object({
    judged: Count,
    avgOnStyle: z.number().nullable(),
    avgAppeal: z.number().nullable(),
    avgComposition: z.number().nullable(),
    textRetryRate: Rate,
    refusalRate: Rate,
  }),
  models: z.object({
    preview: z.array(z.object({ model: z.string(), count: Count, share: z.number().min(0).max(1) })),
    final: z.array(z.object({ model: z.string(), count: Count, share: z.number().min(0).max(1) })),
  }),
});
export type AdminStatsResponse = z.infer<typeof AdminStatsResponse>;

// ---- what was sent to the image model (admin) ----------------------------------------------

export const SentImageRole = z.enum(['preview', 'reference', 'likeness', 'series']);
export type SentImageRole = z.infer<typeof SentImageRole>;
/** One attached image: what it is, where it is stored, and the label sent right before it. */
export const SentImage = z.object({ role: SentImageRole, url: z.string(), label: z.string().optional() });
export type SentImage = z.infer<typeof SentImage>;

/** One image call as it was sent: the exact prompt and the images in order. */
export const SentImageCall = z.object({ model: z.string().nullable(), prompt: z.string(), images: z.array(SentImage) });
export type SentImageCall = z.infer<typeof SentImageCall>;

/**
 * How well an option tells its story: the image check, its redraws, and its direction's reader
 * test. Null scores were never measured; identity scores are also null when the story has no
 * single main subject.
 */
export const OptionStory = z.object({
  score: z.number().int().min(1).max(10).nullable(),
  reason: z.string().nullable(),
  /** Without the headline, would a reader identify the company or person this is about? */
  identityScore: z.number().int().min(1).max(10).nullable(),
  identityReason: z.string().nullable(),
  redraws: z.number().int().min(0),
  readerScore: z.number().int().min(1).max(10).nullable(),
  readerIdentityScore: z.number().int().min(1).max(10).nullable(),
  readerReason: z.string().nullable(),
});
export type OptionStory = z.infer<typeof OptionStory>;

export const AdminOptionInputs = z.object({
  optionId: Id,
  preview: SentImageCall.nullable(),
  final: SentImageCall.nullable(),
  story: OptionStory,
});
export type AdminOptionInputs = z.infer<typeof AdminOptionInputs>;

// ---- errors --------------------------------------------------------------------------------

export const ErrorBody = z.object({
  error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional() }),
});
export type ErrorBody = z.infer<typeof ErrorBody>;
