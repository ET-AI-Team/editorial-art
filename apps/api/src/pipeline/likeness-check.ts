import sharp from 'sharp';
import { z } from 'zod';
import { env } from '../lib/env';
import { StageError } from '../lib/errors';
import { ESTIMATE_INR } from '../lib/pricing';
import type { StyleView } from '../library/styles';
import { BadModelOutput, type ImageData } from '../providers';
import { chat } from './ai';

/**
 * Drawing a real person from confirmed reference photos: the prompt clause, and one cheap vision
 * check that the drawn face looks like the photos. A weak likeness is redrawn once; if it is still
 * weak the option is kept and flagged (Option.likenessWeak) so the editor sees it.
 */

/** The people clause when likeness photos go with the prompt (prompts.ts peopleClause). */
export function realLikenessClause(names: string[]): string {
  return `People: show ${names.join(' and ')} as illustrated figures in this house style: a respectful, recognisable likeness from the attached reference photos, with mild stylisation true to the style, dignified and natural. Never mocking, caricatured or exaggerated unless the editor asks for it. Anyone else in the scene stays generic.`;
}

/** Added to the prompt for the redraw after a weak likeness. */
export const LIKENESS_AGAIN =
  'IMPORTANT: the previous attempt did not look enough like the person in the attached reference photos. Keep the same style and idea, and follow the photos closely for face shape, hairline, eyes, nose, glasses and facial hair.';

/**
 * Style negatives that forbid any real likeness. They protect styles from drawing real people by
 * accident; with a confirmed likeness they would fight the people clause, so they are dropped for
 * that option only. Caricature stays forbidden.
 */
const LIKENESS_NEGATIVES = /^(real person likeness|celebrity likeness|likeness of real people|portraits?)$/i;

export function likenessStyle(style: StyleView, likenessNames: string[]): StyleView {
  if (!likenessNames.length) return style;
  const negative = style.ruleSheet.negative
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !LIKENESS_NEGATIVES.test(s))
    .join(', ');
  return negative === style.ruleSheet.negative ? style : { ...style, ruleSheet: { ...style.ruleSheet, negative } };
}

export const LikenessCheckOutput = z
  .object({
    likeness: z.enum(['good', 'weak']),
    notes: z.string().max(200).default(''),
  })
  .strict();
export type LikenessCheckOutput = z.infer<typeof LikenessCheckOutput>;

/** Thrown on the first pass so preview.ts redraws once, with LIKENESS_AGAIN. */
export class WeakLikeness extends BadModelOutput {
  constructor() {
    super('The drawn face did not look enough like the reference photos.');
  }
}

const SYSTEM = 'You compare an illustration with reference photos of a real person and answer only with JSON.';

export function likenessCheckUser(names: string[], photoCount: number): string {
  return `Image 1 is an editorial illustration that should show ${names.join(' and ')}. Images 2 to ${photoCount + 1} are reference photos of ${names.length > 1 ? 'them' : 'that person'}.
Allowing for the illustration style (simplified shapes, flat colour, loose line), would a reader who knows ${names.length > 1 ? 'these people' : 'this person'} recognise them in image 1? Judge face shape, hairline, eyes, nose, glasses and facial hair, not clothes, pose or colour.
Return only JSON: { "likeness": "good" | "weak", "notes": string }. "weak" when the face could be anyone or looks like someone else; "notes" in a few words.`;
}

/** Vision checks only need a small copy: about 85 tokens an image at low detail. */
const CHECK_SIDE = 512;
async function small(buffer: Buffer): Promise<ImageData> {
  return { buffer: await sharp(buffer).resize(CHECK_SIDE, CHECK_SIDE, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer(), mimeType: 'image/jpeg' };
}

/**
 * Whether the drawn face is weak. On the first pass a weak face throws WeakLikeness (the caller
 * redraws); on the last pass it returns true. A failed check never costs the editor an option,
 * except that the spend cap still stops everything.
 */
export async function checkLikeness(
  call: { requestId: string; optionId: string },
  likenessNames: string[],
  drawn: Buffer,
  photos: ImageData[],
  lastPass: boolean
): Promise<boolean> {
  if (!likenessNames.length || !photos.length) return false;
  let verdict: LikenessCheckOutput;
  try {
    const images = await Promise.all([drawn, ...photos.slice(0, 2).map((p) => p.buffer)].map(small));
    verdict = await chat(
      { stage: 'likeness_check', requestId: call.requestId, optionId: call.optionId },
      {
        kind: 'likeness_check',
        model: env().EA_JUDGE_MODEL,
        system: SYSTEM,
        user: likenessCheckUser(likenessNames, images.length - 1),
        images,
        imageDetail: 'low',
        temperature: 0,
        maxTokens: 80,
      },
      LikenessCheckOutput,
      ESTIMATE_INR.likenessCheck
    );
  } catch (error) {
    if (error instanceof StageError && error.code === 'SPEND_CAP_REACHED') throw error;
    return false;
  }
  if (verdict.likeness === 'good') return false;
  if (!lastPass) throw new WeakLikeness();
  return true;
}
