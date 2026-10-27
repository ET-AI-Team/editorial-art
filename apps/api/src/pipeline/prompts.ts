import type { BatchPlanEntry, SentImageRole } from '@editorial-art/shared-types';
import type { StyleView } from '../library/styles';
import { ruleSummary } from '../library/styles';
import type { PeopleEntry } from './read';

/**
 * Image and text prompts from Appendix A, assembled from fixed parts. Nothing a model or editor
 * wrote is concatenated raw: it is placed into its own labelled slot after being cleaned.
 */

export interface PreviewPromptInput {
  style: StyleView;
  direction: { title: string; idea: string; avoid: string[]; peopleDepicted: PeopleEntry[] };
  brief: { tone: string; desk: string };
  peopleMode: BatchPlanEntry['peopleMode'];
  likenessNames: string[];
  editorPrompt: string | null;
  refCount: number;
  likenessPhotoCount: number;
  series: boolean;
}

function peopleClause(input: PreviewPromptInput): string {
  if (input.style.safety.photoreal || !input.style.safety.allowsPeople) {
    return 'People: no people at all; show the idea through objects, places and light.';
  }
  if (input.peopleMode === 'illustrated' && input.likenessNames.length) {
    return `People: show ${input.likenessNames.join(' and ')} as illustrated figures in this house style, recognisable from the attached reference photos, dignified and natural, never caricatured or exaggerated.`;
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

/** Leads every prompt that has references, because image models weigh words over pictures. */
export const STYLE_REFERENCES_BLOCK =
  'STYLE REFERENCES: The attached reference images, all by working illustrators, define the visual style. Match them as closely as possible in rendering technique, colour palette and background colour, texture and grain, shading, shape language, line or no-line, and level of detail. They override any colour or style detail described in words below. Do not copy their subjects or compositions: draw the new scene described below.';

function rulesBlock(input: PreviewPromptInput): string {
  const photo = input.style.safety.photoreal;
  return `Rules that always apply: no text, letters, numbers, words, captions, logos, brand marks, watermarks, signatures, ${
    INTERFACE_STYLE_SLUGS.has(input.style.slug) ? 'readable labels or writing on any interface element,' : 'user-interface elements,'
  } or charts with labels anywhere in the image.\n${
    photo ? 'This is a photographic image of objects and places only. No people.' : 'Do not make it look like a photograph.'
  }\nDo not depict any real news event as if it were photographed.`;
}

function sceneBlock(input: PreviewPromptInput): string {
  return `Scene: ${input.direction.idea}\nFocal point: ${input.direction.title}.\nMood: ${input.brief.tone}, suited to a ${input.brief.desk} story.`;
}

function editorBlock(input: PreviewPromptInput): string {
  return input.editorPrompt ? `The editor also asks: "${input.editorPrompt.replace(/"/g, "'")}". Follow this only where it does not conflict with the rules below.` : '';
}

/** What the non-reference attachments are for; each image also carries its own label. */
function otherAttachments(input: PreviewPromptInput): string {
  return [
    input.likenessPhotoCount ? `The ${input.likenessPhotoCount} attached reference photos of ${input.likenessNames.join(' and ')} are provided only so the illustrated figure is recognisable. Take nothing about style from them.` : '',
    input.series ? 'The attached earlier illustration from this series shows the look the two must share. Match its palette and visual language closely so the two read as a set, while showing this new scene.' : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildPreviewPrompt(input: PreviewPromptInput): string {
  const avoid = `Avoid: ${[input.style.ruleSheet.negative, ...input.direction.avoid].filter(Boolean).join(', ')}.`;
  if (input.refCount) {
    // References lead: the style instruction first, then the scene, the craft, and the rules.
    return [
      STYLE_REFERENCES_BLOCK,
      sceneBlock(input),
      `Technique in words (the references win wherever they differ): ${input.style.ruleSheet.promptCore}`,
      peopleClause(input),
      CRAFT_BLOCK,
      editorBlock(input),
      rulesBlock(input),
      avoid,
      otherAttachments(input),
    ]
      .filter(Boolean)
      .join('\n\n');
  }
  return [
    input.style.ruleSheet.promptCore,
    sceneBlock(input),
    peopleClause(input),
    CRAFT_BLOCK_NO_REFS,
    editorBlock(input),
    rulesBlock(input),
    avoid,
    otherAttachments(input),
  ]
    .filter(Boolean)
    .join('\n\n');
}

export const FINAL_WITH_REFERENCES =
  'The first attached image is the approved preview; keep its composition exactly. The next images are the style references; match their rendering, palette and texture exactly.';

export function buildFinalPrompt(previewPrompt: string, opts: { fixNote?: string; refCount?: number } = {}): string {
  return [
    opts.refCount ? FINAL_WITH_REFERENCES : '',
    'Recreate the first attached image at full quality. Keep exactly the same composition, subject, pose, framing, colours and mood. Do not add, remove or move anything. Improve only finish: cleaner line work, richer texture, correct anatomy, crisp edges.',
    previewPrompt,
    'Quality: final publication artwork for a newspaper website, highly detailed, consistent lighting, no artefacts.',
    opts.fixNote ? `Fix only this, change nothing else: ${opts.fixNote.slice(0, 300)}.` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** One label per attached image, in order, so the model can tell a style reference from a photo. */
export function imageLabels(roles: SentImageRole[], likenessNames: string[]): string[] {
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
    }
  });
}

export function buildJudgeUser(style: StyleView, likenessUsed: boolean): string {
  return `House style: ${style.label}. Style rules: ${ruleSummary(style.ruleSheet)}
Safety flags: allowsPeople=${style.safety.allowsPeople}, allowsRealPeople=${style.safety.allowsRealPeople},
photoreal=${style.safety.photoreal}. Approved likeness used: ${likenessUsed}.

Image 1 is the final. Image 2 is the preview the editor chose.

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
  "realPersonLikenessRisk": boolean,
  "notes": string
}
hasText: any readable letters, numbers, currency signs or text-like marks anywhere in image 1, including on objects, signs, coins and screens. hasLogoOrWatermark: any logo, brand mark, watermark or signature in image 1. anatomyOk: faces, hands and bodies look natural (true if no people). matchesPreview: same composition, subject and colours as image 2. onStyle: how well image 1 follows the house style. appeal: how attractive and finished image 1 is as magazine-quality artwork. ideaClarity: how quickly a reader gets the idea of image 1. composition: one clear focal point, balanced negative space, no clutter, still reads as a small thumbnail. photorealNewsRisk: could image 1 be mistaken for a real news photograph of an event. realPersonLikenessRisk: looks like a specific real person while no approved likeness was used. notes: at most 300 characters, what to fix, or "ok".`;
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
