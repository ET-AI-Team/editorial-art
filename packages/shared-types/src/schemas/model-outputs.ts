import { z } from 'zod';
import { SensitivityLevel, Slug } from './common';
import { PhotoAdviceKind } from './api';

/**
 * What the models are asked to return. Every model answer is parsed with one of these; an answer
 * that does not parse is a failed attempt, never a partial success.
 */

export const TONES = ['analytical', 'celebratory', 'sombre', 'urgent', 'neutral', 'critical', 'hopeful'] as const;
export const DESKS = [
  'markets',
  'economy',
  'tech',
  'politics',
  'corporate',
  'startups',
  'policy',
  'personal-finance',
  'industry',
  'energy',
  'auto',
  'health',
  'world',
  'prime',
  'other',
] as const;

export const PeopleHow = z.enum(['illustrated', 'symbolised', 'absent']);
export type PeopleHow = z.infer<typeof PeopleHow>;

export const ReadPerson = z
  .object({
    name: z.string().min(1).max(120),
    role: z.string().max(120).default(''),
    isPublicFigure: z.boolean(),
    isMinor: z.boolean(),
  })
  .strict();

/**
 * The news in the story, read before any image is imagined: what changed, who it happened to,
 * the conflict, what is at stake, and what a reader should get from the picture in two seconds.
 */
export const ReadHook = z
  .object({
    claim: z.string().min(1).max(200),
    /** Companies, people, sectors and places, named exactly as in the article. */
    actors: z.array(z.string().min(1).max(120)).max(8),
    /** The verb or conflict: "squeezed", "battle for control", "rate cut lifts". */
    tension: z.string().min(1).max(120),
    /** The key number or consequence. */
    stake: z.string().max(160),
    readerTakeaway: z.string().min(1).max(200),
    /** Concrete Indian markers for the picture, or empty when none fit. */
    indianContext: z.string().max(200),
  })
  .strict();
export type ReadHook = z.infer<typeof ReadHook>;

/** The model is asked for 2 to 4; a fifth or sixth is tolerated and dropped in code. */
export const MUST_SHOW_MAX = 4;
export const MustShow = z.array(z.string().min(2).max(120)).min(2).max(6);

export const IdentityKind = z.enum(['company', 'person', 'institution', 'place', 'product']);
export type IdentityKind = z.infer<typeof IdentityKind>;

/** The model is asked for 2 to 5 cues and at most 3 entries; extras are tolerated and dropped in code. */
export const IDENTITY_CUES_MAX = 5;
export const IDENTITY_MAX = 3;

/**
 * Who a story is about, as a reader would recognise it in a picture without any text or logo:
 * a brand colour, a landmark, a product shape, a public figure, a context marker. Only cues the
 * model is sure of; an unsure cue is left out rather than guessed.
 */
export const IdentityEntry = z
  .object({
    name: z.string().min(1).max(120),
    kind: IdentityKind,
    cues: z.array(z.string().min(2).max(120)).max(8),
  })
  .strict();
export type IdentityEntry = z.infer<typeof IdentityEntry>;

/**
 * The story's main subject first, then up to two other key actors. Empty when the story is about a
 * broad topic with no single subject (inflation, monsoon prices), where identity does not apply.
 */
export const ReadIdentity = z.array(IdentityEntry).max(6);
export type ReadIdentity = z.infer<typeof ReadIdentity>;

/** Cues a direction or rewrite says it shows, copied from the identity. */
const IdentityCues = z.array(z.string().max(120)).max(8).default([]);

export const ReadDirection = z
  .object({
    rank: z.number().int().min(1).max(3),
    title: z.string().min(1).max(60),
    idea: z.string().min(20).max(600),
    /** Concrete things the image must contain, tied to this story. Never logos or readable text. */
    mustShow: MustShow,
    /** One line linking the image to hook.claim. */
    whyItFits: z.string().min(1).max(200),
    /** Which of the main subject's identity cues this idea shows; empty when none fit or there is no single subject. */
    identityCues: IdentityCues,
    suggestedStyleSlug: Slug,
    reason: z.string().max(120),
    peopleDepicted: z.array(z.object({ name: z.string().max(120), how: PeopleHow }).strict()).max(6),
    avoid: z.array(z.string().max(80)).max(4),
  })
  .strict();
export type ReadDirection = z.infer<typeof ReadDirection>;

export const ReadOutput = z
  .object({
    headline: z.string().min(1).max(120),
    thesis: z.string().min(1).max(200),
    tone: z.enum(TONES),
    desk: z.enum(DESKS),
    entities: z
      .object({
        people: z.array(ReadPerson).max(20),
        orgs: z.array(z.string().max(120)).max(20),
        places: z.array(z.string().max(120)).max(20),
        objects: z.array(z.string().max(120)).max(20),
        numbers: z.array(z.string().max(60)).max(5),
      })
      .strict(),
    sensitivity: z.object({ level: SensitivityLevel, reasons: z.array(z.string().max(120)).max(4) }).strict(),
    altTextSeed: z.string().min(1).max(200),
    hook: ReadHook,
    identity: ReadIdentity.default([]),
    directions: z.array(ReadDirection).max(3),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.sensitivity.level !== 'BLOCKED' && v.directions.length !== 3) {
      ctx.addIssue({ code: 'custom', message: 'exactly 3 directions required unless BLOCKED' });
    }
    const ranks = v.directions.map((d) => d.rank).sort();
    if (v.directions.length === 3 && ranks.join(',') !== '1,2,3') {
      ctx.addIssue({ code: 'custom', message: 'ranks must be 1, 2, 3' });
    }
  });
export type ReadOutput = z.infer<typeof ReadOutput>;

export const JudgeOutput = z
  .object({
    hasText: z.boolean(),
    hasLogoOrWatermark: z.boolean(),
    anatomyOk: z.boolean(),
    matchesPreview: z.boolean(),
    onStyle: z.number().int().min(1).max(5),
    /** Craft scores. An answer without them counts as middling, so it neither passes nor fails on them. */
    appeal: z.number().int().min(1).max(5).default(3),
    ideaClarity: z.number().int().min(1).max(5).default(3),
    composition: z.number().int().min(1).max(5).default(3),
    photorealNewsRisk: z.boolean(),
    realPersonLikenessRisk: z.boolean(),
    notes: z.string().max(300),
  })
  .strict();
export type JudgeOutput = z.infer<typeof JudgeOutput>;

/**
 * The pass rule lives in code, not in the model: every check must hold. A final that came out
 * plainly unattractive or broke its composition is retried; the idea itself was fixed when the
 * editor picked the preview, so `ideaClarity` is recorded but does not fail a final.
 */
export function judgePasses(j: JudgeOutput): boolean {
  return (
    !j.hasText &&
    !j.hasLogoOrWatermark &&
    j.anatomyOk &&
    j.matchesPreview &&
    j.onStyle >= 3 &&
    j.appeal >= 2 &&
    j.composition >= 2 &&
    !j.photorealNewsRisk &&
    !j.realPersonLikenessRisk
  );
}

/** Wording an alt text or caption must never use: these images are never photographs. */
export const BANNED_ALT_PHRASES = /(photo of|photograph of|image shows a real)/i;

export const AltTextOutput = z
  .object({
    altText: z
      .string()
      .min(10)
      .max(250)
      .regex(/^Illustration/, 'alt text must start with "Illustration"')
      .refine((s) => !BANNED_ALT_PHRASES.test(s), 'alt text must not call the image a photo'),
    caption: z
      .string()
      .max(200)
      .refine((s) => !BANNED_ALT_PHRASES.test(s), 'caption must not call the image a photo'),
  })
  .strict();
export type AltTextOutput = z.infer<typeof AltTextOutput>;

export const SUBJECT_TAGS = [
  'people',
  'crowd',
  'money',
  'coin',
  'chart',
  'building',
  'city',
  'factory',
  'farm',
  'vehicle',
  'ship',
  'technology',
  'phone',
  'nature',
  'sky',
  'water',
  'document',
  'object',
  'abstract',
  'symbol',
  'animal',
  'food',
  'energy',
  'health',
] as const;

const SUBJECT_SET = new Set<string>(SUBJECT_TAGS);

/** Tags outside the vocabulary are dropped rather than failing the description (models drift). */
const SubjectTags = z
  .array(z.string().max(40))
  .min(1)
  .max(10)
  .transform((tags) => {
    const known = [...new Set(tags.map((t) => t.trim().toLowerCase()).filter((t) => SUBJECT_SET.has(t)))].slice(0, 6) as (typeof SUBJECT_TAGS)[number][];
    return known.length ? known : (['object'] as (typeof SUBJECT_TAGS)[number][]);
  });

export const ReferenceDescription = z
  .object({
    description: z.string().min(40).max(900),
    subjects: SubjectTags,
    mood: z.string().min(2).max(30),
  })
  .strict();
export type ReferenceDescription = z.infer<typeof ReferenceDescription>;

export const ExemplarScreen = z
  .object({
    hasText: z.boolean(),
    hasWatermarkOrSignature: z.boolean(),
    anatomyOk: z.boolean(),
    onStyle: z.number().int().min(1).max(5),
    reason: z.string().max(200),
  })
  .strict();
export type ExemplarScreen = z.infer<typeof ExemplarScreen>;

/**
 * The screen for a real artist's artwork offered to the reference library: how well it matches
 * the style, and anything that keeps it out (writing, marks, a real person, explicit content, or
 * the look of an AI image).
 */
export const ArtworkScreen = z
  .object({
    onStyle: z.number().min(0).max(10),
    hasReadableText: z.boolean(),
    hasLogoOrWatermark: z.boolean(),
    hasSignature: z.boolean(),
    isPhotoOfRealPerson: z.boolean(),
    /** A drawn, painted or caricatured likeness of a real, identifiable person (a politician, actor, CEO). */
    depictsRecognizablePerson: z.boolean(),
    /** Superheroes, cartoon characters, brand mascots, product logos: someone else's IP. */
    hasLicensedCharacterOrBrand: z.boolean(),
    explicitOrGory: z.boolean(),
    isAiGeneratedLooking: z.boolean(),
    reason: z.string().max(300),
  })
  .strict();
export type ArtworkScreen = z.infer<typeof ArtworkScreen>;

/** How strict the artwork screen is. The defaults are the library's standing rule. */
export interface ArtworkPassOptions {
  /** On-style score needed, out of 10. */
  minOnStyle?: number;
  /**
   * Let photos of ordinary people through, for styles such as collage where they are the material.
   * References only set the look, and a drawn likeness of a real, identifiable person still fails.
   */
  allowPeoplePhotos?: boolean;
  /** Let drawn likenesses of public figures through, for the caricature style whose references are exactly that. */
  allowDrawnLikeness?: boolean;
}

/**
 * On style (7 or more out of 10 by default) and none of the flags. A signature is never cropped
 * out, so it fails too. No drawn likeness of a real person ever enters the library, and no
 * photographed person unless the run allows people photos.
 */
export function artworkPasses(s: ArtworkScreen, opts: ArtworkPassOptions = {}): boolean {
  return (
    s.onStyle >= (opts.minOnStyle ?? 7) &&
    !s.hasReadableText &&
    !s.hasLogoOrWatermark &&
    !s.hasSignature &&
    (opts.allowPeoplePhotos || !s.isPhotoOfRealPerson) &&
    (opts.allowDrawnLikeness || !s.depictsRecognizablePerson) &&
    !s.hasLicensedCharacterOrBrand &&
    !s.explicitOrGory &&
    !s.isAiGeneratedLooking
  );
}

/** A rewrite of a direction that failed the reader test: the idea only, never its style or people. */
export const ReaderRewrite = z
  .object({
    title: z.string().min(1).max(60),
    idea: z.string().min(20).max(600),
    mustShow: MustShow,
    whyItFits: z.string().min(1).max(200),
    identityCues: IdentityCues,
  })
  .strict();
export type ReaderRewrite = z.infer<typeof ReaderRewrite>;

/**
 * The reader test: would someone who has just read the headline connect each direction to the
 * story in two seconds? 1 to 10, with a reason, and a rewrite for any direction that fails when
 * one was asked for. When the story has a single main subject, identityScore (1 to 10) says
 * whether a reader would name that subject from the description alone, without the headline.
 */
export const ReaderTestOutput = z
  .object({
    directions: z
      .array(
        z
          .object({
            rank: z.number().int().min(1).max(3),
            score: z.number().int().min(1).max(10),
            identityScore: z.number().int().min(1).max(10).nullable().default(null),
            reason: z.string().max(300),
            rewrite: ReaderRewrite.nullable().default(null),
          })
          .strict()
      )
      .min(1)
      .max(3),
  })
  .strict();
export type ReaderTestOutput = z.infer<typeof ReaderTestOutput>;

/**
 * Does a finished preview tell this article's story at a glance? 1 to 10, with a reason. When the
 * story has a single main subject, identityScore (1 to 10) says whether a reader would identify
 * that company or person without the headline; null when there is none.
 */
export const StoryCheck = z
  .object({
    storyScore: z.number().int().min(1).max(10),
    identityScore: z.number().int().min(1).max(10).nullable().default(null),
    reason: z.string().max(300),
    identityReason: z.string().max(300).default(''),
  })
  .strict();
export type StoryCheck = z.infer<typeof StoryCheck>;

/** The cheap check every preview gets: is there any writing on it? */
export const PreviewTextCheck = z.object({ hasText: z.boolean(), where: z.string().max(120) }).strict();
export type PreviewTextCheck = z.infer<typeof PreviewTextCheck>;

export function exemplarPasses(s: ExemplarScreen): boolean {
  return !s.hasText && !s.hasWatermarkOrSignature && s.anatomyOk && s.onStyle >= 3;
}


/** The photo advisor's answer. The reason is trimmed to PHOTO_ADVICE_REASON_MAX in code. */
export const PhotoAdviceOutput = z
  .object({
    suggestPhoto: z.boolean(),
    kind: PhotoAdviceKind,
    reason: z.string().max(400).default(''),
  })
  .strict();
export type PhotoAdviceOutput = z.infer<typeof PhotoAdviceOutput>;
