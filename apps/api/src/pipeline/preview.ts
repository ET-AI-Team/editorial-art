import { env } from '../lib/env';
import { StageError } from '../lib/errors';
import { cropToAspect, dHash, hammingDistance, isBlank, toWebp } from '../lib/image';
import { db } from '../lib/db';
import { ESTIMATE_INR } from '../lib/pricing';
import { BadModelOutput, ProviderRefusal, providers, type ImageData } from '../providers';
import { PreviewTextCheck } from '@editorial-art/shared-types';
import { chat, generateImage, maybeCrash } from './ai';
import { inputImages, loadOptionContext, type OptionContext } from './context';
import { emitBatchSettled, emitOptionFailed, emitPreviewReady } from './events';
import { cleanEditorPrompt } from './guard/strip';
import { buildPreviewPrompt } from './prompts';
import { batchOutcome, moveBatch, moveOption } from './state';

/**
 * Stage 3 (Step 6.5): one preview. The primary (fast) model first; on a refusal or failure the
 * fallback model once. Two refusals mean the idea is blocked; anything else is retried by BullMQ.
 */

const NEAR_DUPLICATE = 8;

const NO_TEXT_AGAIN =
  'IMPORTANT: the previous attempt had writing in it. Leave every surface blank: no words, letters, numbers, labels, currency symbols or signs on any object, building, boat, flag, screen, coin or chart.';

/** One cheap vision call: previews are what editors judge, so writing on them is caught here. */
async function hasWriting(ctx: OptionContext, webp: Buffer): Promise<PreviewTextCheck> {
  return chat(
    { stage: 'preview_check', requestId: ctx.request.id, optionId: ctx.option.id },
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
    style: ctx.style,
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

async function generateWithFallback(ctx: OptionContext, prompt: string, images: ImageData[]): Promise<{ image: ImageData; model: string }> {
  const config = env();
  const models = [config.EA_PREVIEW_MODEL, config.EA_PREVIEW_FALLBACK_MODEL];
  let refusals = 0;
  let lastError: unknown;
  for (const model of models) {
    try {
      const result = await generateImage({ stage: 'preview', requestId: ctx.request.id, optionId: ctx.option.id }, { provider: 'gemini', model, prompt, images, aspectRatio: '1:1' }, ESTIMATE_INR.previewImage);
      return { image: result.image, model: result.model };
    } catch (error) {
      if (error instanceof StageError && error.code === 'SPEND_CAP_REACHED') throw error;
      if (error instanceof ProviderRefusal) refusals++;
      lastError = error;
    }
  }
  if (refusals === models.length) throw new ProviderRefusal(models[1]!, "This idea couldn't be illustrated safely. Try More options.");
  throw lastError;
}

/** Checks the image is usable and not a near copy of a sibling; returns its processed form. */
async function checkImage(ctx: OptionContext, image: ImageData): Promise<{ webp: Buffer; hash: string }> {
  const cropped = await cropToAspect(image.buffer, 1);
  if (await isBlank(cropped)) throw new BadModelOutput('The image came back blank.');
  const hash = await dHash(cropped);
  const siblings = await db.option.findMany({ where: { batchId: ctx.batch.id, id: { not: ctx.option.id }, previewHash: { not: null } }, select: { previewHash: true } });
  if (siblings.some((s) => hammingDistance(BigInt(`0x${s.previewHash}`), hash) < NEAR_DUPLICATE)) {
    throw new BadModelOutput('The image is a near copy of another option.');
  }
  return { webp: await toWebp(cropped, { width: 1024, height: 1024, quality: 80 }), hash: hash.toString(16).padStart(16, '0') };
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

  const { images, refCount, likenessPhotoCount, series } = await inputImages(ctx);
  const prompt = previewPromptFor(ctx, refCount, likenessPhotoCount, series);

  let produced: { webp: Buffer; hash: string; model: string } | undefined;
  let currentPrompt = prompt;
  for (let pass = 0; pass < 2 && !produced; pass++) {
    const { image, model } = await generateWithFallback(ctx, currentPrompt, images);
    try {
      const checked = await checkImage(ctx, image);
      const writing = await hasWriting(ctx, checked.webp).catch((error: unknown) => {
        // A failed check must not cost the editor an option; the final judge checks again.
        if (error instanceof StageError && error.code === 'SPEND_CAP_REACHED') throw error;
        return { hasText: false, where: '' };
      });
      if (writing.hasText) throw new BadModelOutput(`The image had writing in it (${writing.where || 'somewhere'}).`);
      produced = { ...checked, model };
    } catch (error) {
      if (!(error instanceof BadModelOutput) || pass === 1) throw error;
      if (/writing/.test(error.message)) currentPrompt = `${prompt}\n\n${NO_TEXT_AGAIN}`;
    }
  }
  maybeCrash('preview');

  // Cancelled while generating: the result is discarded (its cost is already recorded).
  const fresh = await db.option.findUnique({ where: { id: ctx.option.id }, include: { batch: true, request: true } });
  if (!fresh || fresh.request.status === 'CANCELLED' || fresh.batch.status === 'CANCELLED') {
    await markFailed(refOf(ctx), 'PREVIEW_FAILED', 'Cancelled.');
    return;
  }

  const upload = await providers().upload(
    { buffer: produced!.webp, mimeType: 'image/webp' },
    { folder: `${env().EA_CLOUDINARY_FOLDER}/${ctx.request.publicId}/previews`, publicId: ctx.option.id, format: 'webp', tags: [`request:${ctx.request.publicId}`] }
  );
  const moved = await moveOption(ctx.option.id, 'PREVIEW_READY', { previewUrl: upload.url, previewPublicId: upload.publicId, previewModel: produced!.model, previewHash: produced!.hash, failureReason: null }, ['GENERATING']);
  if (!moved) return;
  await db.styleReference.updateMany({ where: { id: { in: ctx.option.referenceIds } }, data: { usageCount: { increment: 1 } } });
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

export async function markFailed(ref: OptionRef, state: 'PREVIEW_FAILED' | 'BLOCKED', reason: string): Promise<void> {
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

export async function settleBatch(batchId: string, requestPublicId: string): Promise<void> {
  const options = await db.option.findMany({ where: { batchId }, select: { state: true } });
  const outcome = batchOutcome(options.map((o) => o.state));
  if (!outcome) return;
  if (await moveBatch(batchId, outcome, { completedAt: new Date() }, ['QUEUED', 'RUNNING'])) {
    emitBatchSettled(requestPublicId, batchId, outcome);
  }
}
