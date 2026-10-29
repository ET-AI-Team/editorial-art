import { StoryCheck, type OptionState } from '@editorial-art/shared-types';
import sharp from 'sharp';
import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { ESTIMATE_INR } from '../lib/pricing';
import { escapeDelimited } from '../lib/text';
import { errorSummary } from '../providers/http';
import { chat, type CallContext } from './ai';
import { stripInstructions } from './guard/strip';
import { STORY_CHECK_SYSTEM_PROMPT } from './system-prompts';

/**
 * The story check (Stage 3, beside the writing check): does a finished preview tell this
 * article's story to a reader who sees it as a thumbnail beside the headline? One vision call on
 * a 512px copy at low detail. The score orders a batch's options, and once all four have settled
 * the weakest one may be redrawn once with the check's reason as a note (preview.ts).
 *
 * Optional by design: a failed check keeps the image and leaves the score null.
 */

/** A batch whose weakest option scores under this redraws that option, once. */
export const STORY_REDRAW_BELOW = 6;
export const STORY_CHECK_SIDE = 512;

export interface StoryInput {
  title: string;
  claim: string;
  idea: string;
}

export function buildStoryCheckUser(input: StoryInput): string {
  const story = `HEADLINE: ${input.title.replace(/\n/g, ' ')}\nWHAT CHANGED: ${input.claim.replace(/\n/g, ' ')}\nTHE IMAGE WAS MEANT TO SHOW: ${input.idea.replace(/\n/g, ' ')}`;
  return `<story>
${escapeDelimited(story, 'story')}
</story>

Look at the attached image as a reader who has just read this headline. Score from 1 to 10: does the image tell this article's story at a glance?
9-10: from the image alone a reader could name this story's subject and what happened to it.
7-8: the subject is recognisably this story's (its landmark, product, commodity or people) and the tension is visible.
5-6: right topic and easy to read, but it would fit many stories on this topic (any boardroom, any city, any factory).
3-4: a loose metaphor that only makes sense after reading the headline.
1-2: unrelated or misleading.
Be strict: most competent but generic images are a 5 or 6. Judge only what is visible at thumbnail size; what the image was meant to show is context, not credit.

Return only JSON: { "storyScore": 1-10, "reason": string }
reason: at most 160 characters. Under 8, say what the image should show to make the story clearer, in words an illustrator can act on, never asking for text, labels or logos.`;
}

/** Runs the check; null when it could not run (the image is kept either way). */
export async function checkStory(ctx: CallContext, image: Buffer, input: StoryInput): Promise<StoryCheck | null> {
  try {
    const small = await sharp(image).resize(STORY_CHECK_SIDE, STORY_CHECK_SIDE, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    const answer = await chat(
      { ...ctx, stage: 'story_check' },
      {
        kind: 'story_check',
        model: env().EA_JUDGE_MODEL,
        system: STORY_CHECK_SYSTEM_PROMPT,
        user: buildStoryCheckUser(input),
        images: [{ buffer: small, mimeType: 'image/webp' }],
        imageDetail: 'low',
        temperature: 0,
        maxTokens: 120,
        timeoutMs: 30_000,
      },
      StoryCheck,
      ESTIMATE_INR.storyCheck
    );
    return { storyScore: answer.storyScore, reason: stripInstructions(answer.reason, 300).text };
  } catch (error) {
    logger.warn({ eaRequestId: ctx.requestId, optionId: ctx.optionId, err: errorSummary(error) }, 'story_check_skipped');
    return null;
  }
}

/** Added to the prompt of a story redraw. */
export function storyRedrawNote(reason: string | null): string {
  const clean = reason ? stripInstructions(reason, 200).text.replace(/[.\s]+$/, '') : '';
  return clean
    ? `Make the story clearer: ${clean}. Keep the same idea and style; make the subject and what is happening to it unmistakable at thumbnail size.`
    : 'Make the story clearer: make the subject and what is happening to it unmistakable at thumbnail size.';
}

export interface StoryRow {
  id: string;
  index: number;
  state: OptionState;
  storyScore: number | null;
  storyRedraws: number;
}

/**
 * Which option of a settled batch to redraw, if any: the lowest-scoring preview still waiting to
 * be picked, when it scores under STORY_REDRAW_BELOW. Never a second redraw in the same batch.
 */
export function pickStoryRedraw(rows: StoryRow[]): string | null {
  if (rows.some((r) => r.storyRedraws > 0)) return null;
  const lowest = rows
    .filter((r) => r.state === 'PREVIEW_READY' && r.storyScore !== null)
    .sort((a, b) => a.storyScore! - b.storyScore! || a.index - b.index)[0];
  return lowest && lowest.storyScore! < STORY_REDRAW_BELOW ? lowest.id : null;
}

/** A redraw replaces the first preview only when it is known to tell the story at least as well. */
export function redrawWins(first: number | null, redraw: number | null): boolean {
  if (redraw === null) return false;
  return first === null || redraw >= first;
}

/**
 * The order a batch's options are listed in: options with a preview and a story score, best
 * first; then every other option (a preview without a score, or no preview) in creation order.
 */
export function orderByStory<T extends { index: number; storyScore: number | null; previewUrl: string | null }>(options: T[]): T[] {
  const scored = options.filter((o) => o.previewUrl && o.storyScore !== null);
  const rest = options.filter((o) => !scored.includes(o));
  return [
    ...scored.sort((a, b) => b.storyScore! - a.storyScore! || a.index - b.index),
    ...rest.sort((a, b) => a.index - b.index),
  ];
}
