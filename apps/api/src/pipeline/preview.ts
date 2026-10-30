import { env } from '../lib/env';
import { StageError } from '../lib/errors';
import { checkCopy, cropToAspect, dHash, hammingDistance, isBlank, losslessMaster } from '../lib/image';
import { db } from '../lib/db';
import { logger } from '../lib/logger';
import { ESTIMATE_INR, imageEstimateInr } from '../lib/pricing';
import { assertCanSpend, SpendCapError } from '../lib/spend-guard';
import { BadModelOutput, ProviderRefusal, providers, type ImageData } from '../providers';
import { PreviewTextCheck, type SentImageCall, type StoryCheck } from '@editorial-art/shared-types';
import { imageModels } from '../lib/settings';
import { enqueue } from '../queues/queues';
import { chat, maybeCrash } from './ai';
import { inputImages, loadOptionContext, type OptionContext } from './context';
import { emitBatchSettled, emitOptionFailed, emitPreviewReady } from './events';
import { cleanEditorPrompt } from './guard/strip';
import { buildPreviewPrompt, imageLabels } from './prompts';
import { describeCall, routedImage } from './image-routing';
import { checkLikeness, LIKENESS_AGAIN, likenessStyle, WeakLikeness } from './likeness-check';
import { batchOutcome, moveBatch, moveOption } from './state';
import { cuesToStrengthen, mainSubject } from './identity';
import { checkStory, identityRedrawNote, pickStoryRedraw, redrawNeeds, redrawWins, storyRedrawNote, type StoryRow } from './story-check';

/**
 * Stage 3 (Step 6.5): one preview. The model the admin setting chose first; on a refusal or
 * failure one model from the other provider (image-routing.ts). Two refusals mean the idea is
 * blocked; anything else is retried by BullMQ.
 */

const NEAR_DUPLICATE = 8;

/** Added to the prompt for the second pass when the preview check found writing (admin stats count it). */
export const NO_TEXT_AGAIN =
  'IMPORTANT: the previous attempt had writing in it. Leave every surface blank: no words, letters, numbers, labels, currency symbols or signs on any object, building, boat, flag, screen, coin or chart.';

/** One cheap vision call: previews are what editors judge, so writing on them is caught here. */
async function hasWriting(ctx: OptionContext, webp: Buffer, stage = 'preview_check'): Promise<PreviewTextCheck> {
  return chat(
    { stage, requestId: ctx.request.id, optionId: ctx.option.id },
    {
      kind: 'preview_text',
      model: env().EA_JUDGE_MODEL,
      system: 'You check illustrations for writing. Answer only with JSON.',
      user: 'Does this image contain any readable letters, words, numbers, currency signs or text-like marks anywhere, including on objects, signs, flags, coins or screens? Return only JSON: { "hasText": boolean, "where": string } where "where" names the spot in a few words, or is empty.',
      images: [{ buffer: webp, mimeType: 'image/webp' }],
      temperature: 0,
      maxTokens: 60,
    },
    PreviewTextCheck,
    ESTIMATE_INR.previewTextCheck
  );
}

export function previewPromptFor(ctx: OptionContext, refCount: number, likenessPhotoCount: number, series: boolean): string {
  const editor = cleanEditorPrompt(ctx.request.prompt);
  return buildPreviewPrompt({
    style: likenessStyle(ctx.style, ctx.likenessNames),
    direction: ctx.direction,
    brief: ctx.brief,
    peopleMode: ctx.entry.peopleMode,
    likenessNames: ctx.likenessNames,
    editorPrompt: editor.prompt,
    refCount,
    likenessPhotoCount,
    series,
  });
}

/**
 * Checks the image is usable and not a near copy of a sibling. Returns the lossless master at the
 * size it was generated (2048 at 2K), and a 1024 copy for the text check.
 */
async function checkImage(ctx: OptionContext, image: ImageData): Promise<{ master: { buffer: Buffer; mimeType: string; format: 'png' | 'webp' }; small: Buffer; hash: string }> {
  const cropped = await cropToAspect(image.buffer, 1);
  if (await isBlank(cropped)) throw new BadModelOutput('The image came back blank.');
  const hash = await dHash(cropped);
  const siblings = await db.option.findMany({ where: { batchId: ctx.batch.id, id: { not: ctx.option.id }, previewHash: { not: null } }, select: { previewHash: true } });
  if (siblings.some((s) => hammingDistance(BigInt(`0x${s.previewHash}`), hash) < NEAR_DUPLICATE)) {
    throw new BadModelOutput('The image is a near copy of another option.');
  }
  const [master, small] = await Promise.all([losslessMaster(cropped), checkCopy(cropped)]);
  return { master, small, hash: hash.toString(16).padStart(16, '0') };
}

/**
 * What the story check is told: the article's title (or the read's headline), what changed, the
 * idea, and the main subject with its cues (none for a broad-topic story).
 */
function storyInputFor(ctx: OptionContext) {
  const subject = mainSubject(ctx.brief.identity);
  return {
    title: ctx.request.title || ctx.brief.headline,
    claim: ctx.brief.hook?.claim || ctx.brief.thesis,
    idea: ctx.direction.idea,
    subject: subject ? { name: subject.name, cues: subject.cues } : null,
  };
}

/**
 * The note a redraw carries: what would make the story clearer when the story scored low, and
 * which identity cues to make more prominent when the identity did.
 */
export function redrawNoteFor(ctx: Pick<OptionContext, 'option' | 'brief' | 'direction'>): string {
  const needs = redrawNeeds(ctx.option);
  const subject = mainSubject(ctx.brief.identity);
  const notes = [
    needs.story || !needs.identity ? storyRedrawNote(ctx.option.storyReason) : '',
    needs.identity && subject ? identityRedrawNote(subject.name, cuesToStrengthen(ctx.brief.identity, ctx.direction.identityCues)) : '',
  ];
  return notes.filter(Boolean).join('\n');
}

/**
 * A story redraw is an option sent back for one more preview while it still has its first one
 * (see settleBatch). Only a redraw is ever generating with a preview already in place.
 */
function isStoryRedraw(ctx: OptionContext): boolean {
  return ctx.option.storyRedraws > 0 && !!ctx.option.previewUrl;
}

export async function runPreview(optionId: string): Promise<void> {
  const ctx = await loadOptionContext(optionId);
  if (!ctx) return;
  if (!['PENDING', 'GENERATING'].includes(ctx.option.state)) return;
  if (ctx.request.status === 'CANCELLED' || ctx.batch.status === 'CANCELLED') {
    await markFailed(refOf(ctx), 'PREVIEW_FAILED', 'Cancelled.');
    return;
  }
  if (!(await moveOption(ctx.option.id, 'GENERATING', { previewAttempts: { increment: 1 } }, ['PENDING', 'GENERATING']))) return;
  await moveBatch(ctx.batch.id, 'RUNNING', {}, ['QUEUED']);

  const redraw = isStoryRedraw(ctx);
  const { images, sources, refCount, likenessPhotoCount, series } = await inputImages(ctx);
  const base = previewPromptFor(ctx, refCount, likenessPhotoCount, series);
  const prompt = redraw ? `${base}\n\n${redrawNoteFor(ctx)}` : base;
  const { previewModel } = await imageModels();
  const stage = redraw ? 'story_redraw' : 'preview';

  let produced: (Awaited<ReturnType<typeof checkImage>> & { model: string; sent: SentImageCall; story: StoryCheck | null; likenessWeak: boolean }) | undefined;
  let currentPrompt = prompt;
  for (let pass = 0; pass < 2 && !produced; pass++) {
    const request = { stage: 'preview' as const, model: previewModel, imageSize: env().EA_PREVIEW_IMAGE_SIZE, prompt: currentPrompt, images, sources, likenessNames: ctx.likenessNames };
    // Recorded before the call, so a preview that fails still shows what was sent. A redraw keeps
    // the first preview's record until its own image replaces that preview.
    if (!redraw) await db.option.update({ where: { id: ctx.option.id }, data: { previewInput: describeCall(previewModel, currentPrompt, sources, imageLabels(sources.map((s) => s.role), ctx.likenessNames)) } });
    const call = { stage, requestId: ctx.request.id, optionId: ctx.option.id };
    const { result, model, sent } = await routedImage(call, request);
    const image = result.image;
    try {
      const checked = await checkImage(ctx, image);
      const [writing, story] = await Promise.all([
        hasWriting(ctx, checked.small, redraw ? 'story_redraw' : 'preview_check').catch((error: unknown) => {
          // A failed check must not cost the editor an option; the final judge checks again.
          if (error instanceof StageError && error.code === 'SPEND_CAP_REACHED') throw error;
          return { hasText: false, where: '' };
        }),
        checkStory({ stage: 'story_check', requestId: ctx.request.id, optionId: ctx.option.id }, checked.small, storyInputFor(ctx)),
      ]);
      if (writing.hasText) throw new BadModelOutput(`The image had writing in it (${writing.where || 'somewhere'}).`);
      const likenessWeak = await checkLikeness(call, ctx.likenessNames, checked.small, images.slice(refCount, refCount + likenessPhotoCount), pass === 1);
      produced = { ...checked, model, sent, story, likenessWeak };
    } catch (error) {
      if (!(error instanceof BadModelOutput) || pass === 1) throw error;
      if (/writing/.test(error.message)) currentPrompt = `${prompt}\n\n${NO_TEXT_AGAIN}`;
      if (error instanceof WeakLikeness) currentPrompt = `${prompt}\n\n${LIKENESS_AGAIN}`;
    }
  }
  maybeCrash('preview');

  // Cancelled while generating: the result is discarded (its cost is already recorded).
  const fresh = await db.option.findUnique({ where: { id: ctx.option.id }, include: { batch: true, request: true } });
  if (!fresh || fresh.request.status === 'CANCELLED' || fresh.batch.status === 'CANCELLED') {
    await markFailed(refOf(ctx), 'PREVIEW_FAILED', 'Cancelled.');
    return;
  }

  const story = produced!.story;
  const scores = { storyScore: story?.storyScore ?? null, identityScore: story?.identityScore ?? null };
  const firstScores = { storyScore: ctx.option.storyScore, identityScore: ctx.option.identityScore };
  if (redraw && !redrawWins(firstScores, scores)) {
    // The first preview did at least as well (or the redraw could not be scored): keep it.
    logger.info({ eaRequestId: ctx.request.publicId, optionId: ctx.option.id, first: firstScores, redraw: scores }, 'story_redraw_kept_first');
    await restorePreview(refOf(ctx));
    return;
  }

  // Same public id, so an adopted redraw replaces the first preview rather than leaving it behind.
  const upload = await providers().upload(
    { buffer: produced!.master.buffer, mimeType: produced!.master.mimeType },
    { folder: `${env().EA_CLOUDINARY_FOLDER}/${ctx.request.publicId}/previews`, publicId: ctx.option.id, format: produced!.master.format, tags: [`request:${ctx.request.publicId}`] }
  );
  const moved = await moveOption(
    ctx.option.id,
    'PREVIEW_READY',
    {
      previewUrl: upload.url,
      previewPublicId: upload.publicId,
      previewModel: produced!.model,
      previewHash: produced!.hash,
      previewInput: produced!.sent,
      likenessWeak: produced!.likenessWeak,
      failureReason: null,
      storyScore: scores.storyScore,
      storyReason: story?.reason || null,
      identityScore: scores.identityScore,
      identityReason: story?.identityReason || null,
    },
    ['GENERATING']
  );
  if (!moved) return;
  if (redraw) logger.info({ eaRequestId: ctx.request.publicId, optionId: ctx.option.id, first: firstScores, redraw: scores }, 'story_redraw_adopted');
  else await db.styleReference.updateMany({ where: { id: { in: ctx.option.referenceIds } }, data: { usageCount: { increment: 1 } } });
  emitPreviewReady(ctx.request.publicId, ctx.batch.id, ctx.option.id, upload.url);
  await settleBatch(ctx.batch.id, ctx.request.publicId);
}

/** Called when a preview gives up: blocked after two refusals, or failed after its retries. */
interface OptionRef {
  optionId: string;
  batchId: string;
  requestPublicId: string;
}

function refOf(ctx: OptionContext): OptionRef {
  return { optionId: ctx.option.id, batchId: ctx.batch.id, requestPublicId: ctx.request.publicId };
}

/**
 * A story redraw that gives up, or loses to the first preview, leaves the option exactly as it
 * was before the redraw: ready, with its first preview, score and record.
 */
async function restorePreview(ref: OptionRef): Promise<boolean> {
  const row = await db.option.findUnique({ where: { id: ref.optionId }, select: { previewUrl: true, storyRedraws: true } });
  if (!row?.previewUrl || !row.storyRedraws) return false;
  if (!(await moveOption(ref.optionId, 'PREVIEW_READY', {}, ['PENDING', 'GENERATING']))) return false;
  emitPreviewReady(ref.requestPublicId, ref.batchId, ref.optionId, row.previewUrl);
  await settleBatch(ref.batchId, ref.requestPublicId);
  return true;
}

export async function markFailed(ref: OptionRef, state: 'PREVIEW_FAILED' | 'BLOCKED', reason: string): Promise<void> {
  if (await restorePreview(ref)) return;
  const data = state === 'BLOCKED' ? { blockedReason: reason } : { failureReason: reason };
  if (await moveOption(ref.optionId, state, data, ['PENDING', 'GENERATING'])) {
    emitOptionFailed(ref.requestPublicId, ref.optionId, state, reason);
  }
  await settleBatch(ref.batchId, ref.requestPublicId);
}

/** The worker's last word on a preview whose retries are spent. */
export async function failPreview(optionId: string, error: unknown): Promise<void> {
  const option = await db.option.findUnique({ where: { id: optionId }, select: { id: true, batchId: true, request: { select: { publicId: true } } } });
  if (!option) return;
  const ref = { optionId: option.id, batchId: option.batchId, requestPublicId: option.request.publicId };
  if (error instanceof ProviderRefusal) return markFailed(ref, 'BLOCKED', error.message);
  const reason = error instanceof StageError && error.code === 'SPEND_CAP_REACHED' ? error.message : 'This option could not be made. Try again.';
  return markFailed(ref, 'PREVIEW_FAILED', reason);
}

/**
 * Sends the batch's weakest option back for one story redraw, when the spend caps allow it.
 * 'raced' means another worker changed the option first, so the batch should be looked at again.
 */
async function startStoryRedraw(batchId: string, option: StoryRow & { requestId: string }): Promise<'started' | 'skipped' | 'raced'> {
  const batch = await db.batch.findUnique({ where: { id: batchId }, select: { status: true } });
  if (!batch || !['QUEUED', 'RUNNING'].includes(batch.status)) return 'skipped';
  const { previewModel } = await imageModels();
  const estimate = imageEstimateInr(previewModel, env().EA_PREVIEW_IMAGE_SIZE) + ESTIMATE_INR.previewTextCheck + ESTIMATE_INR.storyCheck;
  try {
    await assertCanSpend(estimate, option.requestId);
  } catch (error) {
    if (!(error instanceof SpendCapError)) throw error;
    logger.info({ batchId, optionId: option.id, scope: error.scope }, 'story_redraw_skipped');
    return 'skipped';
  }
  const { count } = await db.option.updateMany({ where: { id: option.id, state: 'PREVIEW_READY', storyRedraws: 0 }, data: { state: 'PENDING', storyRedraws: { increment: 1 } } });
  if (count !== 1) return 'raced';
  await enqueue.preview({ optionId: option.id }, 'redraw');
  logger.info({ batchId, optionId: option.id, storyScore: option.storyScore, identityScore: option.identityScore }, 'story_redraw');
  return 'started';
}

/**
 * Once every option has a preview result, the batch settles; first, its weakest option may go
 * back for one story redraw (pickStoryRedraw), and the batch then settles when that lands.
 */
export async function settleBatch(batchId: string, requestPublicId: string, depth = 0): Promise<void> {
  const options = await db.option.findMany({
    where: { batchId },
    select: { id: true, index: true, state: true, storyScore: true, identityScore: true, storyRedraws: true, requestId: true },
  });
  const outcome = batchOutcome(options.map((o) => o.state));
  if (!outcome) return;
  const redraw = pickStoryRedraw(options);
  if (redraw) {
    const started = await startStoryRedraw(batchId, options.find((o) => o.id === redraw)!);
    if (started === 'started') return;
    if (started === 'raced' && depth < 2) return settleBatch(batchId, requestPublicId, depth + 1);
  }
  if (await moveBatch(batchId, outcome, { completedAt: new Date() }, ['QUEUED', 'RUNNING'])) {
    emitBatchSettled(requestPublicId, batchId, outcome);
  }
}
