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
 * article's story to a reader who sees it as a thumbnail beside the headline? When the story has a
 * single main subject, the same call also scores identity: without the headline, would a reader
 * identify that company or person? One vision call on a 512px copy at low detail. The scores order
 * a batch's options, and once all four have settled the weakest one may be redrawn once with the
 * check's reasons as a note (preview.ts).
 *
 * Optional by design: a failed check keeps the image and leaves the scores null.
 */

/** A batch whose weakest option scores under this, for story or identity, redraws that option, once. */
export const STORY_REDRAW_BELOW = 6;
export const STORY_CHECK_SIDE = 512;

export interface StoryInput {
  title: string;
  claim: string;
  idea: string;
  /** The story's main subject and its visual cues; null or absent for a broad-topic story. */
  subject?: { name: string; cues: string[] } | null;
}

const oneLine = (s: string) => s.replace(/\n/g, ' ');

export function buildStoryCheckUser(input: StoryInput): string {
  const subject = input.subject ?? null;
  const story = [
    `HEADLINE: ${oneLine(input.title)}`,
    `WHAT CHANGED: ${oneLine(input.claim)}`,
    `THE IMAGE WAS MEANT TO SHOW: ${oneLine(input.idea)}`,
    subject ? `THE SUBJECT: ${oneLine(subject.name)}${subject.cues.length ? `. What could identify it without text: ${subject.cues.map(oneLine).join('; ')}` : ''}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const identity = subject
    ? `

Then cover the headline and score identityScore from 1 to 10: from the image alone, would a reader identify ${oneLine(subject.name)} specifically, not just its sector?
9-10: unmistakably this subject (its signature colour on its own product, its landmark, its people).
6-8: most likely this subject, though a close rival could fit.
3-5: the right sector or topic, but any company or person in it would fit.
1-2: nothing in the image points to the subject.`
    : '';
  const shape = subject ? '{ "storyScore": 1-10, "identityScore": 1-10, "reason": string, "identityReason": string }' : '{ "storyScore": 1-10, "reason": string }';
  const identityReason = subject
    ? '\nidentityReason: at most 160 characters. Under 8, say which of the identifying cues to make more prominent, never asking for text, labels or logos.'
    : '';
  return `<story>
${escapeDelimited(story, 'story')}
</story>

Look at the attached image as a reader who has just read this headline. Score from 1 to 10: does the image tell this article's story at a glance?
9-10: from the image alone a reader could name this story's subject and what happened to it.
7-8: the subject is recognisably this story's (its landmark, product, commodity or people) and the tension is visible.
5-6: right topic and easy to read, but it would fit many stories on this topic (any boardroom, any city, any factory).
3-4: a loose metaphor that only makes sense after reading the headline.
1-2: unrelated or misleading.
Be strict: most competent but generic images are a 5 or 6. Judge only what is visible at thumbnail size; what the image was meant to show is context, not credit.${identity}

Return only JSON: ${shape}
reason: at most 160 characters. Under 8, say what the image should show to make the story clearer, in words an illustrator can act on, never asking for text, labels or logos.${identityReason}`;
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
        maxTokens: input.subject ? 220 : 120,
        timeoutMs: 30_000,
      },
      StoryCheck,
      ESTIMATE_INR.storyCheck
    );
    // Identity is only scored for a story with a single subject, whatever the model sent back.
    const identity = input.subject ? answer.identityScore : null;
    return {
      storyScore: answer.storyScore,
      identityScore: identity,
      reason: stripInstructions(answer.reason, 300).text,
      identityReason: identity === null ? '' : stripInstructions(answer.identityReason, 300).text,
    };
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

/** Added to the prompt of a redraw for a weak identity: the cues to make more prominent. */
export function identityRedrawNote(name: string, cues: string[]): string {
  const subject = stripInstructions(name, 120).text || 'the subject';
  const clean = cues.map((c) => stripInstructions(c, 120).text).filter(Boolean);
  const list = clean.length > 1 ? `${clean.slice(0, -1).join(', ')} and ${clean[clean.length - 1]}` : clean[0];
  return list
    ? `Make it unmistakably about ${subject}: make ${list} more prominent, so a reader knows who this is about without the headline. Keep the same idea and style.`
    : `Make it unmistakably about ${subject}, so a reader knows who this is about without the headline. Keep the same idea and style.`;
}

export interface StoryScores {
  storyScore: number | null;
  /** Absent or null when the story has no single subject (or the check did not score it). */
  identityScore?: number | null;
}

export interface StoryRow extends StoryScores {
  id: string;
  index: number;
  state: OptionState;
  storyRedraws: number;
}

/** One number for ordering and comparing: story plus identity, an unscored identity counting as the story score. */
export function combinedScore(s: StoryScores): number | null {
  if (s.storyScore === null) return null;
  return s.storyScore + (s.identityScore ?? s.storyScore);
}

/** Why an option needs a redraw: its story or its identity scored under the bar. */
export function redrawNeeds(s: StoryScores): { story: boolean; identity: boolean } {
  return {
    story: s.storyScore !== null && s.storyScore < STORY_REDRAW_BELOW,
    identity: s.identityScore !== null && s.identityScore !== undefined && s.identityScore < STORY_REDRAW_BELOW,
  };
}

/**
 * Which option of a settled batch to redraw, if any: of the previews still waiting to be picked
 * whose story or identity scores under STORY_REDRAW_BELOW, the one with the lowest combined score.
 * Never a second redraw in the same batch.
 */
export function pickStoryRedraw(rows: StoryRow[]): string | null {
  if (rows.some((r) => r.storyRedraws > 0)) return null;
  const weakest = rows
    .filter((r) => r.state === 'PREVIEW_READY' && r.storyScore !== null)
    .filter((r) => {
      const needs = redrawNeeds(r);
      return needs.story || needs.identity;
    })
    .sort((a, b) => combinedScore(a)! - combinedScore(b)! || a.index - b.index)[0];
  return weakest?.id ?? null;
}

/** A redraw replaces the first preview only when it is known to do at least as well overall. */
export function redrawWins(first: StoryScores, redraw: StoryScores): boolean {
  const after = combinedScore(redraw);
  if (after === null) return false;
  const before = combinedScore(first);
  return before === null || after >= before;
}

/**
 * The order a batch's options are listed in: options with a preview and a story score, best
 * combined score (story plus identity) first; then every other option (a preview without a score,
 * or no preview) in creation order.
 */
export function orderByStory<T extends StoryScores & { index: number; previewUrl: string | null }>(options: T[]): T[] {
  const scored = options.filter((o) => o.previewUrl && o.storyScore !== null);
  const rest = options.filter((o) => !scored.includes(o));
  return [
    ...scored.sort((a, b) => combinedScore(b)! - combinedScore(a)! || a.index - b.index),
    ...rest.sort((a, b) => a.index - b.index),
  ];
}
