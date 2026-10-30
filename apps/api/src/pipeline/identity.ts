import { ReadIdentity, type IdentityEntry } from '@editorial-art/shared-types';
import { fold } from './guard/sensitivity';

/**
 * Subject identity: who a story is about, as a reader recognises it in a picture without any text
 * or logo (the read's `identity`, main subject first). Pure helpers shared by the read, the
 * reader test, the image prompts and the story check.
 */

/** The story's main subject, or null for a broad-topic story (or a brief read before identity existed). */
export function mainSubject(identity: IdentityEntry[] | null | undefined): IdentityEntry | null {
  return identity?.[0] ?? null;
}

/** A brief's stored identity, or null when it has none or it does not parse. */
export function storedIdentity(value: unknown): IdentityEntry[] | null {
  const parsed = ReadIdentity.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Kinds that can carry a brand colour. A person or a place has none, whatever the cue says. */
const BRAND_KINDS = new Set<IdentityEntry['kind']>(['company', 'product', 'institution']);

const HEX = /#[0-9a-f]{6}\b/i;
const COLOUR_WORD =
  /\b(red|blue|green|yellow|orange|purple|violet|pink|magenta|maroon|crimson|scarlet|saffron|gold|golden|silver|teal|turquoise|navy|indigo|black|white|brown|beige|cyan|lime|olive|colou?rs?)\b/i;
/** A cue that names a thing (a blue building, a red bus) is a landmark or object cue, not a colour cue. */
const THING_WORD =
  /\b(building|centre|center|tower|house|headquarters|hq|facade|store|stores|shop|outlet|router|box|card|sim|car|cars|bus|truck|taxi|rickshaw|bike|scooter|phone|bell|bull|statue|logo|uniform|uniforms|vehicle|plane|aircraft|train|bottle|pack|can|sign|signage|street|station|campus|plant|factory|port|ship)\b/i;

/** Whether a cue is a brand colour ("Jio deep royal blue", "Airtel red #E40000"), not a thing that has a colour. */
export function isColourCue(cue: string): boolean {
  return HEX.test(cue) || (COLOUR_WORD.test(cue) && !THING_WORD.test(cue));
}

const key = (s: string) => fold(s).replace(/[^a-z0-9#]+/g, ' ').trim();

/** Whether a cue a direction lists is one of the subject's cues (models paraphrase a little). */
export function sameCue(a: string, b: string): boolean {
  const x = key(a);
  const y = key(b);
  return x.length >= 3 && y.length >= 3 && (x === y || x.includes(y) || y.includes(x));
}

/**
 * The brand colour the hero object should carry: a colour cue of a brand-like main subject that
 * the direction itself chose to show. Null otherwise, so a direction the model built on a landmark
 * or a person is never repainted in brand colour.
 */
export function heroBrandColour(identity: IdentityEntry[] | null | undefined, directionCues: string[] | undefined): string | null {
  const main = mainSubject(identity);
  if (!main || !BRAND_KINDS.has(main.kind) || !directionCues?.length) return null;
  const colours = main.cues.filter(isColourCue);
  for (const cue of directionCues) {
    if (colours.some((c) => sameCue(c, cue))) return colours.find((c) => sameCue(c, cue))!;
  }
  return null;
}

/**
 * The cues to make more prominent in an identity redraw: the ones the direction chose, then the
 * subject's others, at most three.
 */
export function cuesToStrengthen(identity: IdentityEntry[] | null | undefined, directionCues: string[] | undefined): string[] {
  const main = mainSubject(identity);
  if (!main) return [];
  const chosen = (directionCues ?? []).filter(Boolean);
  const rest = main.cues.filter((c) => !chosen.some((d) => sameCue(c, d)));
  return [...chosen, ...rest].slice(0, 3);
}
