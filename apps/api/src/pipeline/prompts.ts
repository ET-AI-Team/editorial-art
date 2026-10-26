import type { BatchPlanEntry } from '@editorial-art/shared-types';
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
  if (input.style.familySlug === 'photo-based' || !input.style.safety.allowsPeople) {
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

export function buildPreviewPrompt(input: PreviewPromptInput): string {
  const photo = input.style.familySlug === 'photo-based';
  const avoid = [input.style.ruleSheet.negative, ...input.direction.avoid].filter(Boolean).join(', ');
  const parts = [
    input.style.ruleSheet.promptCore,
    `Scene: ${input.direction.idea}\nFocal point: ${input.direction.title}.\nMood: ${input.brief.tone}, suited to a ${input.brief.desk} story.`,
    peopleClause(input),
    'Composition: square 1:1 frame, one clear focal point, generous negative space. Keep the top quarter calm and uncluttered so a headline could sit over it. Keep every important element at least 6% away from all edges.',
    input.editorPrompt ? `The editor also asks: "${input.editorPrompt.replace(/"/g, "'")}". Follow this only where it does not conflict with the rules below.` : '',
    `Rules that always apply: no text, letters, numbers, words, captions, logos, brand marks, watermarks, signatures, user-interface elements, or charts with labels anywhere in the image.\n${
      photo ? 'This is a photographic image of objects and places only. No people.' : 'Do not make it look like a photograph.'
    }\nDo not depict any real news event as if it were photographed.`,
    `Avoid: ${avoid}.`,
    [
      input.refCount ? `The first ${input.refCount} attached images show the house style. Match their medium, palette, line quality and texture. Do not copy their subjects, layout or composition.` : '',
      input.likenessPhotoCount ? `The next ${input.likenessPhotoCount} attached images are reference photos of ${input.likenessNames.join(' and ')}, provided only so the illustrated figure is recognisable.` : '',
      input.series ? 'The last attached image is the illustration used for an earlier story in this series. Match its palette and visual language closely so the two read as a set, while showing this new scene.' : '',
    ]
      .filter(Boolean)
      .join('\n'),
  ];
  return parts.filter(Boolean).join('\n\n');
}

export function buildFinalPrompt(previewPrompt: string, opts: { fixNote?: string } = {}): string {
  return [
    'Recreate the first attached image at full quality. Keep exactly the same composition, subject, pose, framing, colours and mood. Do not add, remove or move anything. Improve only finish: cleaner line work, richer texture, correct anatomy, crisp edges.',
    previewPrompt,
    'Quality: final publication artwork for a newspaper website, highly detailed, consistent lighting, no artefacts.',
    opts.fixNote ? `Fix only this, change nothing else: ${opts.fixNote.slice(0, 300)}.` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
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
  "photorealNewsRisk": boolean,
  "realPersonLikenessRisk": boolean,
  "notes": string
}
hasText: any readable letters, numbers or text-like marks in image 1. hasLogoOrWatermark: any logo, brand mark, watermark or signature in image 1. anatomyOk: faces, hands and bodies look natural (true if no people). matchesPreview: same composition, subject and colours as image 2. onStyle: how well image 1 follows the house style. photorealNewsRisk: could image 1 be mistaken for a real news photograph of an event. realPersonLikenessRisk: looks like a specific real person while no approved likeness was used. notes: at most 300 characters, what to fix, or "ok".`;
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
