import type { BatchPlanEntry, IdentityEntry, SentImageRole } from '@editorial-art/shared-types';
import type { StyleView } from '../library/styles';
import { ruleSummary } from '../library/styles';
import { logoLine } from './brand-logo';
import { heroBrandColour } from './identity';
import { realLikenessClause } from './likeness-check';
import type { PeopleEntry } from './read';

/**
 * Image and text prompts from Appendix A, assembled from fixed parts. Nothing a model or editor
 * wrote is concatenated raw: it is placed into its own labelled slot after being cleaned.
 */

export interface PreviewPromptInput {
  style: StyleView;
  /** `mustShow` and `identityCues` are empty or absent for directions read before they existed. */
  direction: { title: string; idea: string; avoid: string[]; peopleDepicted: PeopleEntry[]; mustShow?: string[]; identityCues?: string[] };
  /** `hook` and `identity` are null or absent for briefs read before they existed. */
  brief: { tone: string; desk: string; hook?: { tension: string; indianContext: string } | null; identity?: IdentityEntry[] | null };
  peopleMode: BatchPlanEntry['peopleMode'];
  likenessNames: string[];
  editorPrompt: string | null;
  refCount: number;
  likenessPhotoCount: number;
  series: boolean;
  /** The brand whose official logo is attached for the hero object; null or absent without one. */
  logoName?: string | null;
}

function peopleClause(input: PreviewPromptInput): string {
  if (input.style.safety.photoreal || !input.style.safety.allowsPeople) {
    return 'People: no people at all; show the idea through objects, places and light.';
  }
  if (input.peopleMode === 'illustrated' && input.likenessNames.length) {
    return realLikenessClause(input.likenessNames);
  }
  if (input.peopleMode === 'illustrated' || input.peopleMode === 'symbolised') {
    const names = input.direction.peopleDepicted.filter((p) => p.how !== 'absent').map((p) => p.name);
    const who = names.length ? names.join(' and ') : 'the people in the story';
    return `People: do not show anyone's face. Represent ${who} only through a symbolic object, a silhouette, or a figure seen from behind.`;
  }
  return 'People: no identifiable people. Anonymous figures may appear only small, distant, or from behind.';
}

/**
 * Styles whose look is made of interface pieces (cursors, windows, chat bubbles). They may show
 * those pieces, but never any readable text on them; every other style shows none at all.
 */
export const INTERFACE_STYLE_SLUGS = new Set(['interface-hybrid']);

/**
 * Craft asked of every image, whatever the style: the style sets the look, this sets the bar.
 * Kept short on purpose; it rides along with every preview and final. It names no colours and no
 * layout zones, so nothing here competes with the references.
 */
const CRAFT_POINTS =
  'One dominant focal point with a clear, bold silhouette that still reads as a small thumbnail. A deliberate composition built for a square 1:1 frame, with balanced negative space and every important element at least 6% away from all edges (safe margins). Polished, finished, magazine-cover quality, with careful edges and texture true to the style. No clutter: leave out anything that does not serve the idea.';
export const CRAFT_BLOCK = `Craft: Style fidelity to the references comes first. ${CRAFT_POINTS}`;
const CRAFT_BLOCK_NO_REFS = `Craft: ${CRAFT_POINTS}`;

/**
 * Follows the story in every prompt that has references: the story decides what is shown, the
 * references decide how it is drawn. With a hero brand colour, the references keep the palette of
 * everything except the hero object, which keeps the subject's colour so the subject is recognisable.
 */
const REFERENCES_LEAD =
  'STYLE REFERENCES: The attached reference images, all by working illustrators, define the visual style. Match them as closely as possible in rendering technique, colour palette and background colour, texture and grain, shading, shape language, line or no-line, and level of detail.';
const REFERENCES_TAIL = 'They set the rendering, palette and texture, and they never change what is shown: do not copy their subjects or compositions; draw the story above.';
export const STYLE_REFERENCES_BLOCK = `${REFERENCES_LEAD} They override any colour or style detail described in words. ${REFERENCES_TAIL}`;
export const STYLE_REFERENCES_BLOCK_BRAND = `${REFERENCES_LEAD} They override any colour or style detail described in words, except the hero object's brand colour given above, which the hero keeps, rendered in the references' technique. ${REFERENCES_TAIL}`;

/** The brand colour this option's hero object carries, if any (see heroBrandColour). */
export function brandColourFor(input: Pick<PreviewPromptInput, 'direction' | 'brief'>): string | null {
  return heroBrandColour(input.brief.identity, input.direction.identityCues);
}

export const STORY_HEADING = 'THE STORY (must be clear at thumbnail size):';

function rulesBlock(input: PreviewPromptInput): string {
  const photo = input.style.safety.photoreal;
  const logo = input.logoName;
  return `Rules that always apply: ${logo ? `apart from the attached official ${logo} logo on the hero object, ` : ''}no text, letters, numbers, words, captions, ${logo ? 'other ' : ''}logos, brand marks, watermarks, signatures, ${
    INTERFACE_STYLE_SLUGS.has(input.style.slug) ? 'readable labels or writing on any interface element,' : 'user-interface elements,'
  } or charts with labels anywhere in the image. ${
    logo ? 'Names in the story say who it is about: never write them or their initials, and add no logo but the attached one.' : 'Names in the story say who it is about: never write them, their initials or their logos.'
  }\n${
    photo ? 'This is a photographic image of objects and places only. No people.' : 'Do not make it look like a photograph.'
  }\nDo not depict any real news event as if it were photographed.`;
}

/**
 * What the image must show, first in every prompt: the idea, its concrete elements, the subject's
 * brand colour on the hero object when the idea uses it, the tension, the place.
 */
function storyBlock(input: PreviewPromptInput): string {
  const must = input.direction.mustShow?.filter(Boolean) ?? [];
  const hook = input.brief.hook;
  const colour = brandColourFor(input);
  const hero = must[0] ?? input.direction.title;
  const palette = input.refCount ? "the references' palette" : "the style's palette";
  return [
    `${STORY_HEADING} ${input.direction.idea}`,
    must.length ? `Must show, the first as the focal point:\n${must.map((m) => `- ${m}`).join('\n')}` : `Focal point: ${input.direction.title}.`,
    colour ? `The hero object (${hero}) carries the subject's brand colour (${colour}), so the subject is recognisable; everything else follows ${palette}.` : '',
    input.logoName ? logoLine(input.logoName, hero) : '',
    hook?.tension ? `The tension to make visible: ${hook.tension}.` : '',
    hook?.indianContext ? `Indian context: ${hook.indianContext}.` : '',
    `Mood: ${input.brief.tone}, suited to a ${input.brief.desk} story.`,
  ]
    .filter(Boolean)
    .join('\n');
}

function editorBlock(input: PreviewPromptInput): string {
  return input.editorPrompt ? `The editor also asks: "${input.editorPrompt.replace(/"/g, "'")}". Follow this only where it does not conflict with the rules below.` : '';
}

/** What the non-reference attachments are for; each image also carries its own label. */
function otherAttachments(input: PreviewPromptInput): string {
  return [
    input.likenessPhotoCount ? `The ${input.likenessPhotoCount} attached reference photos of ${input.likenessNames.join(' and ')} are provided only so the illustrated figure is recognisable. Take nothing about style from them.` : '',
    input.logoName ? `The attached official ${input.logoName} logo is the only branding allowed in the image; take nothing about style from it.` : '',
    input.series ? 'The attached earlier illustration from this series shows the look the two must share. Match its palette and visual language closely so the two read as a set, while showing this new scene.' : '',
  ]
    .filter(Boolean)
    .join('\n');
}

const BARE_LOGO_BAN = /^(no )?(logos?|brand marks?)$/i;

/**
 * The style's negatives and the direction's avoid list. With an official logo attached, a bare
 * "logos" or "no logos" would contradict the logo line, so it becomes "other logos".
 */
function avoidLine(input: PreviewPromptInput): string {
  if (!input.logoName) return `Avoid: ${[input.style.ruleSheet.negative, ...input.direction.avoid].filter(Boolean).join(', ')}.`;
  const items = [...input.style.ruleSheet.negative.split(','), ...input.direction.avoid].map((a) => a.trim()).filter(Boolean).map((a) => (BARE_LOGO_BAN.test(a) ? 'other logos' : a));
  return `Avoid: ${items.filter((a, i) => items.findIndex((b) => b.toLowerCase() === a.toLowerCase()) === i).join(', ')}.`;
}

/**
 * Content first, then style, then craft, then rules: the story and who may appear, the editor's
 * ask, the references (or the style in words), the craft bar, the rules and the avoid list.
 */
export function buildPreviewPrompt(input: PreviewPromptInput): string {
  const avoid = avoidLine(input);
  // A style's words may ban logos outright; the attached official logo is the one exception.
  const core = `${input.style.ruleSheet.promptCore}${input.logoName ? ` The attached official ${input.logoName} logo is the only exception to any rule against logos.` : ''}`;
  const style = input.refCount
    ? [brandColourFor(input) ? STYLE_REFERENCES_BLOCK_BRAND : STYLE_REFERENCES_BLOCK, `Technique in words (the references win wherever they differ): ${core}`]
    : [`Style: ${core}`];
  return [
    storyBlock(input),
    peopleClause(input),
    editorBlock(input),
    ...style,
    input.refCount ? CRAFT_BLOCK : CRAFT_BLOCK_NO_REFS,
    rulesBlock(input),
    avoid,
    otherAttachments(input),
  ]
    .filter(Boolean)
    .join('\n\n');
}

export const FINAL_WITH_REFERENCES =
  'The first attached image is the approved preview; keep its composition exactly. The next images are the style references; match their rendering, palette and texture exactly.';
export const FINAL_WITH_REFERENCES_BRAND =
  "The first attached image is the approved preview; keep its composition exactly. The next images are the style references; match their rendering, palette and texture exactly, except that the hero object keeps the subject's brand colour as in the preview.";

export function buildFinalPrompt(previewPrompt: string, opts: { fixNote?: string; refCount?: number; brandColour?: boolean } = {}): string {
  return [
    opts.refCount ? (opts.brandColour ? FINAL_WITH_REFERENCES_BRAND : FINAL_WITH_REFERENCES) : '',
    'Recreate the first attached image at full quality. Keep exactly the same composition, subject, pose, framing, colours and mood. Do not add, remove or move anything. Improve only finish: cleaner line work, richer texture, correct anatomy, crisp edges.',
    previewPrompt,
    'Quality: final publication artwork for a newspaper website, highly detailed, consistent lighting, no artefacts.',
    opts.fixNote ? `Fix only this, change nothing else: ${opts.fixNote.slice(0, 300)}.` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** One label per attached image, in order, so the model can tell a style reference from a photo or a logo. */
export function imageLabels(roles: SentImageRole[], likenessNames: string[], logoName?: string | null): string[] {
  const total = (role: SentImageRole) => roles.filter((r) => r === role).length;
  const seen = new Map<SentImageRole, number>();
  return roles.map((role) => {
    const n = (seen.get(role) ?? 0) + 1;
    seen.set(role, n);
    switch (role) {
      case 'preview':
        return 'Approved preview (keep its composition exactly):';
      case 'reference':
        return `Style reference ${n} of ${total('reference')}:`;
      case 'likeness':
        return `Reference photo ${n} of ${total('likeness')} of ${likenessNames.join(' and ') || 'the person'}, for likeness only, not style:`;
      case 'series':
        return 'Earlier illustration in this series (match its palette and visual language):';
      case 'logo':
        return `Official logo of ${logoName || 'the subject'} (reproduce it exactly on the hero object, not a style reference):`;
    }
  });
}

export function buildJudgeUser(style: StyleView, likenessUsed: boolean, logoName: string | null = null): string {
  const logo = logoName
    ? `\nImage 3 is the official ${logoName} logo, the only branding allowed, on the hero object. The official ${logoName} logo or wordmark is allowed; any other text is not. Report that logo only in allowedLogoSeen, never in hasText or hasLogoOrWatermark.\n`
    : '';
  return `House style: ${style.label}. Style rules: ${ruleSummary(style.ruleSheet)}
Safety flags: allowsPeople=${style.safety.allowsPeople}, allowsRealPeople=${style.safety.allowsRealPeople},
photoreal=${style.safety.photoreal}. Approved likeness used: ${likenessUsed}.

Image 1 is the final. Image 2 is the preview the editor chose.
${logo}
Return:
{
  "hasText": boolean,
  "hasLogoOrWatermark": boolean,
  "anatomyOk": boolean,
  "matchesPreview": boolean,
  "onStyle": 1 | 2 | 3 | 4 | 5,
  "appeal": 1 | 2 | 3 | 4 | 5,
  "ideaClarity": 1 | 2 | 3 | 4 | 5,
  "composition": 1 | 2 | 3 | 4 | 5,
  "photorealNewsRisk": boolean,
  "realPersonLikenessRisk": boolean,${logoName ? '\n  "allowedLogoSeen": boolean,' : ''}
  "notes": string
}
hasText: any readable letters, numbers, currency signs or text-like marks anywhere in image 1, including on objects, signs, coins and screens${logoName ? ', other than the allowed logo' : ''}. hasLogoOrWatermark: any logo, brand mark, watermark or signature in image 1${logoName ? ' other than the allowed logo. allowedLogoSeen: the allowed logo appears in image 1' : ''}. anatomyOk: faces, hands and bodies look natural (true if no people). matchesPreview: same composition, subject and colours as image 2. onStyle: how well image 1 follows the house style. appeal: how attractive and finished image 1 is as magazine-quality artwork. ideaClarity: how quickly a reader gets the idea of image 1. composition: one clear focal point, balanced negative space, no clutter, still reads as a small thumbnail. photorealNewsRisk: could image 1 be mistaken for a real news photograph of an event. realPersonLikenessRisk: looks like a specific real person while no approved likeness was used. notes: at most 300 characters, what to fix, or "ok".`;
}



export const ALT_TEXT_SYSTEM = 'You write accessibility text for a news website and answer only with JSON.';
export function buildAltTextUser(input: { altTextSeed: string; idea: string; styleLabel: string; seen: string }): string {
  return `Write accessibility alt text and a neutral caption for an editorial illustration on a news site.
The image is an illustration, not a photograph.

Story summary: ${input.altTextSeed}
Illustration idea: ${input.idea}
Style: ${input.styleLabel}
What the checker saw: ${input.seen || 'not available'}

Return only JSON:
{
  "altText": string,
  "caption": string
}
altText: at most 250 characters; describe what is visible; start with "Illustration of".
caption: at most 200 characters; a neutral line an editor could use; no claims of fact beyond the story summary.
Never say "photo", "photograph" or "picture of a real". Never name a person unless they are named in the story summary.`;
}
