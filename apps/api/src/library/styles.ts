import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseStyleLibrary,
  RuleSheet,
  StyleSafety,
  type RuleSheet as RuleSheetT,
  type SensitivityLevel,
  type StyleSafety as StyleSafetyT,
} from '@editorial-art/shared-types';
import { db } from '../lib/db';
import { SATIRE_PRONE_SLUGS } from '../pipeline/guard/sensitivity';

/** A style as the pipeline uses it: typed rule sheet and safety flags, never raw JSON. */
export interface StyleView {
  id: string;
  slug: string;
  label: string;
  summary: string;
  /** One of FAMILY_SLUGS for a style of the current library; a retired style keeps its old family. */
  familySlug: string;
  goodFor: string[];
  ruleSheet: RuleSheetT;
  safety: StyleSafetyT;
  status: 'DRAFT' | 'CURATING' | 'LIVE' | 'RETIRED';
  sortOrder: number;
  coverReferenceIds: string[];
  minApprovedRefs: number;
}

type StyleRow = Awaited<ReturnType<typeof db.style.findMany<{ include: { family: true } }>>>[number];

export function toStyleView(row: StyleRow): StyleView {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    summary: row.summary,
    familySlug: row.family.slug,
    goodFor: row.goodFor,
    ruleSheet: RuleSheet.parse(row.ruleSheet),
    safety: StyleSafety.parse(row.safety),
    status: row.status,
    sortOrder: row.sortOrder,
    coverReferenceIds: row.coverReferenceIds,
    minApprovedRefs: row.minApprovedRefs,
  };
}

export async function liveStyles(): Promise<StyleView[]> {
  const rows = await db.style.findMany({ where: { status: 'LIVE' }, include: { family: true }, orderBy: [{ sortOrder: 'asc' }] });
  return rows.map(toStyleView);
}

export async function styleById(id: string): Promise<StyleView | null> {
  const row = await db.style.findUnique({ where: { id }, include: { family: true } });
  return row ? toStyleView(row) : null;
}

export async function stylesByIds(ids: string[]): Promise<Map<string, StyleView>> {
  const rows = await db.style.findMany({ where: { id: { in: [...new Set(ids)] } }, include: { family: true } });
  return new Map(rows.map((r) => [r.id, toStyleView(r)]));
}

/** Whether a style may be used for a story at this sensitivity (Step 4.11.1). */
export function styleAllowed(style: Pick<StyleView, 'slug' | 'safety'>, level: SensitivityLevel): boolean {
  if (level === 'BLOCKED') return false;
  if (level === 'HIGH') return style.safety.allowsSensitive;
  if (level === 'ELEVATED') return !SATIRE_PRONE_SLUGS.has(style.slug);
  return true;
}

/** The plain-words badges a style card shows (Step 5.6.1). */
export function styleBadges(style: Pick<StyleView, 'safety'>): string[] {
  const badges: string[] = [];
  if (style.safety.photoreal) badges.push('Objects only');
  else if (!style.safety.allowsPeople) badges.push('No people');
  if (!style.safety.allowsSensitive) badges.push('Not for sensitive stories');
  else badges.push('Good for sensitive stories');
  return badges;
}

/** A short rule summary for judge and screen prompts. */
export function ruleSummary(rs: RuleSheetT): string {
  return `Medium: ${rs.medium}. Palette: ${rs.palette}. Line: ${rs.line}. Texture: ${rs.texture}. Avoid: ${rs.negative}.`;
}

export function styleLibraryPath(): string {
  return process.env.EA_STYLE_LIBRARY_PATH ?? join(import.meta.dir, '../../../../docs/STYLE_LIBRARY.md');
}

/**
 * Upserts the families and styles in STYLE_LIBRARY.md, by slug. Safe to run again: it updates
 * definitions but never changes the status, covers or references of a style in the file. A
 * style no longer in the file is RETIRED (never deleted, and its references are kept), so it
 * leaves the gallery. Families are never deleted either: a family of an earlier library keeps
 * its retired styles, and the gallery leaves out a family with no style that is not retired.
 */
export async function seedStyles(markdown = readFileSync(styleLibraryPath(), 'utf8')): Promise<{ families: number; styles: number; retired: number }> {
  const seed = parseStyleLibrary(markdown);
  const familyIds = new Map<string, string>();
  for (const f of seed.families) {
    const row = await db.styleFamily.upsert({ where: { slug: f.slug }, create: f, update: { label: f.label, sortOrder: f.sortOrder } });
    familyIds.set(f.slug, row.id);
  }
  for (const s of seed.styles) {
    const data = {
      familyId: familyIds.get(s.familySlug)!,
      label: s.label,
      summary: s.summary,
      goodFor: s.goodFor,
      ruleSheet: s.ruleSheet,
      safety: s.safety,
      sortOrder: s.sortOrder,
    };
    await db.style.upsert({ where: { slug: s.slug }, create: { slug: s.slug, ...data }, update: data });
  }
  const retired = await db.style.updateMany({
    where: { slug: { notIn: seed.styles.map((s) => s.slug) }, status: { not: 'RETIRED' } },
    data: { status: 'RETIRED', retiredAt: new Date() },
  });
  return { families: seed.families.length, styles: seed.styles.length, retired: retired.count };
}
