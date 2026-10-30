import type { IdentityEntry, SensitivityLevel } from '@editorial-art/shared-types';
import { brandLogosAllowed } from '../lib/brand-logos';
import { db } from '../lib/db';

/**
 * Official brand logos on the hero object (EA_BRAND_LOGOS). The read model decides per direction
 * whether the main subject's logo genuinely helps (useLogo); code then applies it only when:
 * the gate lets this actor have logos, the story has no sensitivity at all (a brand on a fraud,
 * raid or court story could imply wrongdoing), the main subject is a company or a product, and a
 * freely licensed logo was found (library/logos.ts). At most one logo per image, the main subject's.
 *
 * The logo goes to the image model as an attached image, reproduced exactly; no other text is ever
 * allowed. The text checks allow that logo only, and the story check reports whether it came out
 * faithful (logoOk), which can trigger the batch's one redraw.
 */

const LOGO_KINDS = new Set<IdentityEntry['kind']>(['company', 'product']);

/** Leads the read's message when the gate lets this actor have logos (empty otherwise). */
export function brandLogoNote(actorRole: string): string {
  if (!brandLogosAllowed(actorRole)) return '';
  return 'BRAND LOGO\nWhen the main subject is a company or brand, we can place its official logo, from its own file, on a direction\'s hero object. Set "useLogo": true only where the logo genuinely helps a reader identify the subject and fits naturally: a hero object that really carries this brand\'s logo (its SIM card, its router box, its store front, its delivery van). Set false for an abstract metaphor where a logo would look stuck on, a landmark, a person, or a story not about one company. Never describe or draw the logo yourself in the idea or mustShow; it is added from the file.\n\n';
}

/** Whether a logo may be used at all for this story and actor (before any lookup). */
export function logoEligible(input: { level: SensitivityLevel | null | undefined; actorRole: string | null | undefined; subject: IdentityEntry | null }): boolean {
  return input.level === 'NONE' && brandLogosAllowed(input.actorRole) && !!input.subject && LOGO_KINDS.has(input.subject.kind);
}

/** The logo a batch option takes: the brief's, when its direction asked for it and the story still allows it. */
export function logoForOption(input: { briefLogoId: string | null; useLogo: boolean; level: SensitivityLevel | null | undefined; actorRole: string | null | undefined }): string | null {
  if (!input.briefLogoId || !input.useLogo || input.level !== 'NONE' || !brandLogosAllowed(input.actorRole)) return null;
  return input.briefLogoId;
}

/** Added to the prompt of a redraw whose logo came out garbled or missing. */
export const LOGO_AGAIN =
  'Reproduce the attached logo exactly: the same shape, letters and colours as the attached file, flat and legible on the hero object, with no other text anywhere.';

/** The line in the story block: where the logo goes and that it is copied, never invented. */
export function logoLine(name: string, hero: string): string {
  return `Place the attached official ${name} logo on the hero object (${hero}), reproduced exactly as given: same shape, letters and colours, flat and legible, sized like real branding on that object. Keep its own colours even where the references' palette differs. Do not invent or alter it. No other text anywhere.`;
}

/** "Logo: {name} (trademark of its owner), via Wikimedia Commons" for the logo an option used. */
export async function logoCredits(brandLogoId: string | null): Promise<string[]> {
  if (!brandLogoId) return [];
  const logo = await db.brandLogo.findUnique({ where: { id: brandLogoId } });
  if (!logo) return [];
  return [`Logo: ${logo.name} (trademark of its owner)${logo.source === 'WIKIMEDIA' ? ', via Wikimedia Commons' : ''}`];
}
