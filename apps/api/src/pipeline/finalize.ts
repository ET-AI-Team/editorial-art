import { JudgeOutput, judgePasses } from '@editorial-art/shared-types';
import sharp from 'sharp';
import { db } from '../lib/db';
import { env } from '../lib/env';
import { StageError } from '../lib/errors';
import { cropToAspect } from '../lib/image';
import { ESTIMATE_INR } from '../lib/pricing';
import { ProviderRefusal, providers, type ImageData } from '../providers';
import { chat, generateImage, maybeCrash } from './ai';
import { fetchCached, inputImages, loadOptionContext, type OptionContext } from './context';
import { emitFinalReady, emitOptionFailed, emitRequestStatus } from './events';
import { enqueue } from '../queues/queues';
import { buildFinalPrompt, buildJudgeUser } from './prompts';
import { previewPromptFor } from './preview';
import { moveOption, moveRequest } from './state';
import { JUDGE_SYSTEM_PROMPT } from './system-prompts';

/**
 * Stage 4 (Step 6.6): the picked preview at full quality, judged once in code. One retry with the
 * judge's notes; after that the final fails and the preview stays usable.
 */

async function render(ctx: OptionContext, prompt: string, preview: ImageData, extras: ImageData[]): Promise<{ image: Buffer; model: string }> {
  const config = env();
  const call = { requestId: ctx.request.id, optionId: ctx.option.id, stage: 'finalize' };
  try {
    const r = await generateImage(call, { provider: 'gemini', model: config.EA_FINAL_MODEL, prompt, images: [preview, ...extras], aspectRatio: '16:9' }, ESTIMATE_INR.finalImage);
    return { image: await cropToAspect(r.image.buffer, 16 / 9), model: r.model };
  } catch (error) {
    if (error instanceof StageError && error.code === 'SPEND_CAP_REACHED') throw error;
    const r = await generateImage(
      call,
      { provider: 'openai', model: config.EA_FINAL_FALLBACK_MODEL, prompt: `${prompt}\n\nThe output must be 16:9 content centred in the canvas; it will be cropped to 1536x864.`, images: [preview, ...extras.slice(0, 3)], aspectRatio: '16:9' },
      ESTIMATE_INR.openaiFinal
    );
    return { image: await cropToAspect(r.image.buffer, 16 / 9), model: r.model };
  }
}

async function judge(ctx: OptionContext, finalImage: Buffer, preview: ImageData): Promise<JudgeOutput> {
  const small = await sharp(finalImage).resize({ width: 1024, withoutEnlargement: true }).png().toBuffer();
  return chat(
    { stage: 'judge', requestId: ctx.request.id, optionId: ctx.option.id },
    {
      kind: 'judge',
      model: env().EA_JUDGE_MODEL,
      system: JUDGE_SYSTEM_PROMPT,
      user: buildJudgeUser(ctx.style, ctx.likenessNames.length > 0),
      images: [{ buffer: small, mimeType: 'image/png' }, preview],
      temperature: 0,
      maxTokens: 400,
    },
    JudgeOutput,
    ESTIMATE_INR.judge
  );
}

export async function runFinalize(optionId: string): Promise<void> {
  const ctx = await loadOptionContext(optionId);
  if (!ctx || ctx.option.state !== 'FINALIZING' || !ctx.option.previewUrl) return;

  const preview = await fetchCached(ctx.option.previewUrl, 1024);
  const { images, refCount, likenessPhotoCount, series } = await inputImages(ctx);
  const basePrompt = previewPromptFor(ctx, refCount, likenessPhotoCount, series);

  let fixNote: string | undefined;
  let lastVerdict: JudgeOutput | undefined;
  for (let attempt = 1; attempt <= 2; attempt++) {
    await db.option.update({ where: { id: ctx.option.id }, data: { finalAttempts: { increment: 1 } } });
    const { image, model } = await render(ctx, buildFinalPrompt(basePrompt, { fixNote }), preview, images);
    const verdict = await judge(ctx, image, preview);
    lastVerdict = verdict;
    if (judgePasses(verdict)) {
      maybeCrash('finalize');
      const upload = await providers().upload(
        { buffer: image, mimeType: 'image/png' },
        { folder: `${env().EA_CLOUDINARY_FOLDER}/${ctx.request.publicId}/finals`, publicId: ctx.option.id, format: 'png', tags: [`request:${ctx.request.publicId}`] }
      );
      if (!(await moveOption(ctx.option.id, 'FINAL_READY', { finalUrl: upload.url, finalPublicId: upload.publicId, finalModel: model, judge: verdict, failureReason: null }, ['FINALIZING']))) return;
      await db.styleReference.updateMany({ where: { id: { in: ctx.option.referenceIds } }, data: { pickCount: { increment: 1 } } });
      if (await moveRequest(ctx.request.id, 'HAS_FINAL', {}, ['ACTIVE'])) emitRequestStatus(ctx.request.publicId, 'HAS_FINAL');
      emitFinalReady(ctx.request.publicId, ctx.option.id, upload.url);
      await enqueue.pack({ optionId: ctx.option.id }, Date.now());
      return;
    }
    fixNote = verdict.notes && verdict.notes !== 'ok' ? verdict.notes : 'remove any text, logos or artefacts';
  }
  await failFinal(ctx.option.id, 'The full-quality image did not pass its checks. Try again, or pick another option.', lastVerdict);
}

export async function failFinal(optionId: string, reason: string, verdict?: JudgeOutput): Promise<void> {
  const option = await db.option.findUnique({ where: { id: optionId }, select: { requestId: true, request: { select: { publicId: true } } } });
  if (!option) return;
  if (await moveOption(optionId, 'FINAL_FAILED', { failureReason: reason, ...(verdict ? { judge: verdict } : {}) }, ['FINALIZING'])) {
    emitOptionFailed(option.request.publicId, optionId, 'FINAL_FAILED', reason);
  }
}

export function finalFailureReason(error: unknown): string {
  if (error instanceof ProviderRefusal) return 'The image model declined to finish this one. Pick another option.';
  if (error instanceof StageError && error.code === 'SPEND_CAP_REACHED') return error.message;
  return 'The full-quality image could not be made. Try again.';
}
