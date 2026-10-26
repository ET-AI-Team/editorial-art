import { z } from 'zod';
import { SensitivityLevel, Slug } from './common';

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

export const ReadDirection = z
  .object({
    rank: z.number().int().min(1).max(3),
    title: z.string().min(1).max(60),
    idea: z.string().min(20).max(600),
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
    photorealNewsRisk: z.boolean(),
    realPersonLikenessRisk: z.boolean(),
    notes: z.string().max(300),
  })
  .strict();
export type JudgeOutput = z.infer<typeof JudgeOutput>;

/** The pass rule lives in code, not in the model: every check must hold. */
export function judgePasses(j: JudgeOutput): boolean {
  return (
    !j.hasText &&
    !j.hasLogoOrWatermark &&
    j.anatomyOk &&
    j.matchesPreview &&
    j.onStyle >= 3 &&
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

export const ReferenceDescription = z
  .object({
    description: z.string().min(40).max(900),
    subjects: z.array(z.enum(SUBJECT_TAGS)).min(1).max(6),
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

export function exemplarPasses(s: ExemplarScreen): boolean {
  return !s.hasText && !s.hasWatermarkOrSignature && s.anatomyOk && s.onStyle >= 3;
}

export const SubjectBoxes = z
  .object({
    boxes: z
      .array(
        z
          .object({
            label: z.string().max(40),
            x: z.number().min(0).max(1),
            y: z.number().min(0).max(1),
            w: z.number().min(0).max(1),
            h: z.number().min(0).max(1),
          })
          .strict()
      )
      .max(6),
  })
  .strict();
export type SubjectBoxes = z.infer<typeof SubjectBoxes>;
