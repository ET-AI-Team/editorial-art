import { JudgeOutput, judgePasses, type SentImage, type SentImageCall } from '@editorial-art/shared-types';
import { imageModels } from '../lib/settings';
import sharp from 'sharp';
import { db } from '../lib/db';
import { env } from '../lib/env';
import { StageError } from '../lib/errors';
import { cropToAspect } from '../lib/image';
import { ESTIMATE_INR } from '../lib/pricing';
import { ProviderRefusal, providers, type ImageData } from '../providers';
import { chat, maybeCrash } from './ai';
import { fetchCached, inputImages, loadOptionContext, type InputImages, type OptionContext } from './context';
import { describeCall, routedImage } from './image-routing';
import { emitFinalReady, emitOptionFailed, emitRequestStatus } from './events';
import { enqueue } from '../queues/queues';
import { likenessStyle } from './likeness-check';
import { brandColourFor, buildFinalPrompt, buildJudgeUser, imageLabels } from './prompts';
import { previewPromptFor } from './preview';
import { moveOption, moveRequest } from './state';
import { JUDGE_SYSTEM_PROMPT } from './system-prompts';

/**
 * Stage 4 (Step 6.6): the picked preview at full quality, judged once in code. One retry with the
 * judge's notes; after that the final fails and the preview stays usable. The style references go
 * with the preview, so the final keeps their rendering and texture as well as the composition.
 */

/**
 * The final: the approved preview first, then the option's style references (and any likeness
 * photos or series image), each labelled, by the model the admin setting chose for finals.
 */
async function render(ctx: OptionContext, prompt: string, preview: { url: string; image: ImageData }, inputs: InputImages): Promise<{ image: Buffer; model: string; sent: SentImageCall }> {
  const { finalModel, finalImageSize } = await imageModels();
  const call = { requestId: ctx.request.id, optionId: ctx.option.id, stage: 'finalize' };
  const sources: SentImage[] = [{ role: 'preview', url: preview.url }, ...inputs.sources];
  await db.option.update({ where: { id: ctx.option.id }, data: { finalInput: describeCall(finalModel, prompt, sources, imageLabels(sources.map((s) => s.role), ctx.likenessNames)) } });
  const r = await routedImage(call, { stage: 'final', model: finalModel, imageSize: finalImageSize, prompt, images: [preview.image, ...inputs.images], sources, likenessNames: ctx.likenessNames });
  await db.option.update({ where: { id: ctx.option.id }, data: { finalInput: r.sent } });
  return { image: await cropToAspect(r.result.image.buffer, 1), model: r.model, sent: r.sent };
}

async function judge(ctx: OptionContext, finalImage: Buffer, preview: ImageData): Promise<JudgeOutput> {
  const small = await sharp(finalImage).resize({ width: 1024, withoutEnlargement: true }).png().toBuffer();
  return chat(
    { stage: 'judge', requestId: ctx.request.id, optionId: ctx.option.id },
    {
      kind: 'judge',
      model: env().EA_JUDGE_MODEL,
      system: JUDGE_SYSTEM_PROMPT,
      user: buildJudgeUser(likenessStyle(ctx.style, ctx.likenessNames), ctx.likenessNames.length > 0),
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

  // The preview goes in at the size it was made, so the final starts from every detail of it.
  const preview = await fetchCached(ctx.option.previewUrl, 2048);
  const inputs = await inputImages(ctx);
  const basePrompt = previewPromptFor(ctx, inputs.refCount, inputs.likenessPhotoCount, inputs.series);

  let fixNote: string | undefined;
  let lastVerdict: JudgeOutput | undefined;
  for (let attempt = 1; attempt <= 2; attempt++) {
    await db.option.update({ where: { id: ctx.option.id }, data: { finalAttempts: { increment: 1 } } });
    const prompt = buildFinalPrompt(basePrompt, { fixNote, refCount: inputs.refCount, brandColour: !!brandColourFor(ctx) });
    const { image, model } = await render(ctx, prompt, { url: ctx.option.previewUrl, image: preview }, inputs);
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
