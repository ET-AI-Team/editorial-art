import { z } from 'zod';
import { Slug } from './common';

/**
 * The families of the current library, in gallery order. Families and styles of earlier
 * libraries stay in the database (retired, never deleted), so a family slug read back from a
 * stored row may be one that is not listed here: responses carry it as a plain string.
 */
export const FAMILY_SLUGS = [
  'conceptual-flat',
  'collage',
  'objects-sets',
  'painting',
  'drawing',
  'printmaking',
  'comic-cartoon',
  'surreal-data',
  'modern-indian',
] as const;
export const FamilySlug = z.enum(FAMILY_SLUGS);
export type FamilySlug = z.infer<typeof FamilySlug>;

/** How a style looks. `promptCore` is inserted into every image prompt in this style. */
export const RuleSheet = z
  .object({
    medium: z.string().min(3).max(300),
    palette: z.string().min(3).max(400),
    line: z.string().min(3).max(300),
    texture: z.string().min(3).max(300),
    composition: z.string().min(3).max(300),
    lighting: z.string().min(3).max(300),
    figures: z.string().min(3).max(300),
    do: z.array(z.string().min(3).max(200)).min(3).max(8),
    dont: z.array(z.string().min(3).max(200)).min(3).max(8),
    promptCore: z.string().min(40).max(600),
    negative: z.string().min(3).max(400),
  })
  .strict();
export type RuleSheet = z.infer<typeof RuleSheet>;

/** Enforced in code by the pipeline, not just described in prompts. */
export const StyleSafety = z
  .object({
    allowsPeople: z.boolean(),
    allowsRealPeople: z.boolean(),
    allowsSensitive: z.boolean(),
    photoreal: z.boolean(),
  })
  .strict()
  .refine((s) => !s.allowsRealPeople || s.allowsPeople, 'a style cannot allow real people without allowing people')
  .refine((s) => !(s.photoreal && s.allowsRealPeople), 'photo-real styles never allow real people');
export type StyleSafety = z.infer<typeof StyleSafety>;

export const StyleSeed = z
  .object({
    slug: Slug,
    familySlug: FamilySlug,
    label: z.string().min(2).max(60),
    summary: z.string().min(5).max(160),
    goodFor: z.array(z.string().min(2).max(40)).min(1).max(12),
    ruleSheet: RuleSheet,
    safety: StyleSafety,
    sortOrder: z.number().int(),
  })
  .strict();
export type StyleSeed = z.infer<typeof StyleSeed>;

export const FamilySeed = z.object({ slug: FamilySlug, label: z.string(), sortOrder: z.number().int() }).strict();

/**
 * The library in STYLE_LIBRARY.md: every family of FAMILY_SLUGS once, in order, each with at
 * least one style. Families may hold different numbers of styles.
 */
export const StyleLibrarySeed = z
  .object({ families: z.array(FamilySeed).length(FAMILY_SLUGS.length), styles: z.array(StyleSeed).min(1) })
  .strict()
  .superRefine((v, ctx) => {
    const slugs = new Set(v.styles.map((s) => s.slug));
    if (slugs.size !== v.styles.length) ctx.addIssue({ code: 'custom', message: 'style slugs must be unique' });
    const families = v.families.map((f) => f.slug);
    if (families.join() !== FAMILY_SLUGS.join()) ctx.addIssue({ code: 'custom', message: `families must be ${FAMILY_SLUGS.join(', ')}, in that order` });
    for (const style of v.styles) {
      if (!families.includes(style.familySlug)) ctx.addIssue({ code: 'custom', message: `style ${style.slug} is in family ${style.familySlug}, which is not listed` });
    }
    for (const family of families) {
      if (!v.styles.some((s) => s.familySlug === family)) ctx.addIssue({ code: 'custom', message: `family ${family} has no styles` });
    }
  });
export type StyleLibrarySeed = z.infer<typeof StyleLibrarySeed>;
