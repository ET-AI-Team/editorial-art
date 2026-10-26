import { z } from 'zod';
import { Slug } from './common';

export const FAMILY_SLUGS = ['illustration', 'painting', 'drawing-print', 'craft-3d', 'graphic-collage', 'photo-based'] as const;
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

export const StyleLibrarySeed = z
  .object({ families: z.array(FamilySeed).length(6), styles: z.array(StyleSeed).length(24) })
  .strict()
  .superRefine((v, ctx) => {
    const slugs = new Set(v.styles.map((s) => s.slug));
    if (slugs.size !== v.styles.length) ctx.addIssue({ code: 'custom', message: 'style slugs must be unique' });
    for (const family of FAMILY_SLUGS) {
      const count = v.styles.filter((s) => s.familySlug === family).length;
      if (count !== 4) ctx.addIssue({ code: 'custom', message: `family ${family} has ${count} styles, expected 4` });
    }
  });
export type StyleLibrarySeed = z.infer<typeof StyleLibrarySeed>;
