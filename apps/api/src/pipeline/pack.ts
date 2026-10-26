import { AltTextOutput, SubjectBoxes, type PackAsset, type PackSize } from '@editorial-art/shared-types';
import sharp from 'sharp';
import { db } from '../lib/db';
import { env } from '../lib/env';
import { StageError } from '../lib/errors';
import { logger } from '../lib/logger';
import { toJpeg, toWebp } from '../lib/image';
import { ESTIMATE_INR } from '../lib/pricing';
import { BadModelOutput, providers } from '../providers';
import { chat, generateImage, maybeCrash } from './ai';
import { clampBoxes, cropWindow, type Box } from './crop';
import { emitPackReady, emitOptionFailed } from './events';
import { ALT_TEXT_SYSTEM, buildAltTextUser, EXTEND_PROMPT, SUBJECT_BOXES_SYSTEM, SUBJECT_BOXES_USER } from './prompts';
import { moveOption } from './state';
import { styleById } from '../library/styles';

/**
 * Stage 5 (Step 6.7): four sizes, alt text, caption and credit for a finalized option. Crops are
 * done in code around the subjects; only a 9:16 that cannot be cropped is extended by the model,
 * and if the extension changes the original it falls back to a letterbox.
 */

const SIZES: { size: PackSize; width: number; height: number }[] = [
  { size: '16x9', width: 1600, height: 900 },
  { size: '1x1', width: 1080, height: 1080 },
  { size: '1.91x1', width: 1200, height: 628 },
  { size: '9x16', width: 1080, height: 1920 },
];

/** Mean absolute difference (0 to 255) between the master and the middle band of an extension. */
export async function extensionDrift(master: Buffer, extended: Buffer): Promise<number> {
  const W = 64;
  const tall = await sharp(extended).resize(W, Math.round((W * 16) / 9), { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const bandH = Math.round((W * 9) / 16);
  const top = Math.round((tall.info.height - bandH) / 2);
  const band = await sharp(tall.data, { raw: { width: W, height: tall.info.height, channels: 1 } }).extract({ left: 0, top, width: W, height: bandH }).raw().toBuffer();
  const ref = await sharp(master).resize(W, bandH, { fit: 'fill' }).greyscale().raw().toBuffer();
  let sum = 0;
  for (let i = 0; i < ref.length; i++) sum += Math.abs((ref[i] ?? 0) - (band[i] ?? 0));
  return sum / ref.length;
}

async function letterbox(master: Buffer, width: number, height: number): Promise<Buffer> {
  const background = await sharp(master).resize(width, height, { fit: 'cover' }).blur(40).modulate({ brightness: 0.7 }).toBuffer();
  const fitted = await sharp(master).resize(width, height, { fit: 'inside' }).toBuffer();
  return sharp(background).composite([{ input: fitted, gravity: 'center' }]).png().toBuffer();
}

async function subjectBoxes(optionId: string, requestId: string, cached: unknown, master: Buffer): Promise<Box[]> {
  const parsed = SubjectBoxes.safeParse(cached);
  if (parsed.success) return clampBoxes(parsed.data.boxes);
  const small = await sharp(master).resize({ width: 1024 }).png().toBuffer();
  try {
    const result = await chat(
      { stage: 'pack_text', requestId, optionId },
      { kind: 'subject_boxes', model: env().EA_TEXT_MODEL, system: SUBJECT_BOXES_SYSTEM, user: SUBJECT_BOXES_USER, images: [{ buffer: small, mimeType: 'image/png' }], temperature: 0, maxTokens: 400 },
      SubjectBoxes,
      ESTIMATE_INR.text
    );
    await db.option.update({ where: { id: optionId }, data: { subjectBoxes: result } });
    return clampBoxes(result.boxes);
  } catch (error) {
    if (error instanceof StageError && error.code === 'SPEND_CAP_REACHED') throw error;
    return []; // No boxes: centred crops, still a usable pack.
  }
}

async function renderSize(
  master: Buffer,
  meta: { width: number; height: number },
  target: { size: PackSize; width: number; height: number },
  boxes: Box[],
  extend: () => Promise<Buffer | null>
): Promise<{ image: Buffer; method: PackAsset['method'] }> {
  if (target.size === '16x9') return { image: await sharp(master).resize(target.width, target.height, { fit: 'cover' }).png().toBuffer(), method: 'resize' };
  const window = cropWindow(meta.width, meta.height, target.width / target.height, boxes);
  if (window) {
    const image = await sharp(master).extract(window).resize(target.width, target.height, { fit: 'cover' }).png().toBuffer();
    return { image, method: 'crop' };
  }
  if (target.size === '9x16') {
    const extended = await extend();
    if (extended) return { image: await sharp(extended).resize(target.width, target.height, { fit: 'cover' }).png().toBuffer(), method: 'extend' };
  }
  return { image: await letterbox(master, target.width, target.height), method: 'letterbox' };
}

async function altText(ctx: { requestId: string; optionId: string; altTextSeed: string; idea: string; title: string; styleLabel: string; seen: string }) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await chat(
        { stage: 'pack_text', requestId: ctx.requestId, optionId: ctx.optionId },
        { kind: 'alt_text', model: env().EA_TEXT_MODEL, system: ALT_TEXT_SYSTEM, user: buildAltTextUser(ctx), temperature: 0.3, maxTokens: 300 },
        AltTextOutput,
        ESTIMATE_INR.text
      );
    } catch (error) {
      if (!(error instanceof BadModelOutput)) throw error;
    }
  }
  return { altText: `Illustration: ${ctx.title}`.slice(0, 250), caption: '' };
}

export async function runPack(optionId: string): Promise<void> {
  const option = await db.option.findUnique({ where: { id: optionId }, include: { request: true } });
  if (!option?.finalUrl) return;
  if (!(await moveOption(option.id, 'PACKING', {}, ['FINAL_READY', 'PACK_FAILED', 'PACK_READY', 'PACKING']))) return;
  const [brief, direction, style] = await Promise.all([
    db.brief.findFirst({ where: { requestId: option.requestId }, orderBy: { version: 'desc' } }),
    db.direction.findUnique({ where: { id: option.directionId } }),
    styleById(option.styleId),
  ]);
  if (!brief || !direction || !style) throw new StageError('INVALID_STATE', 'The option is missing its brief, direction or style.', false);

  const master = (await providers().fetchImage(option.finalUrl, 2048)).buffer;
  const meta = await sharp(master).metadata();
  const dims = { width: meta.width ?? 0, height: meta.height ?? 0 };
  const boxes = await subjectBoxes(option.id, option.requestId, option.subjectBoxes, master);

  const extend = async (): Promise<Buffer | null> => {
    try {
      const r = await generateImage(
        { stage: 'pack_extend', requestId: option.requestId, optionId: option.id },
        { provider: 'gemini', model: env().EA_EXTEND_MODEL, prompt: EXTEND_PROMPT, images: [{ buffer: master, mimeType: 'image/png' }], aspectRatio: '9:16' },
        ESTIMATE_INR.extendImage
      );
      const drift = await extensionDrift(master, r.image.buffer);
      if (drift > 28) {
        logger.info({ optionId: option.id, drift }, 'pack_extension_rejected');
        return null;
      }
      return r.image.buffer;
    } catch (error) {
      if (error instanceof StageError && error.code === 'SPEND_CAP_REACHED') throw error;
      return null;
    }
  };

  const credit = env().EA_CREDIT_LINE;
  const folder = `${env().EA_CLOUDINARY_FOLDER}/${option.request.publicId}/pack/${option.id}`;
  const assets: PackAsset[] = [];
  for (const target of SIZES) {
    const { image, method } = await renderSize(master, dims, target, boxes, extend);
    const [webp, jpg] = await Promise.all([toWebp(image, { quality: 82 }), toJpeg(image, { quality: 85, copyright: credit })]);
    const [w, j] = await Promise.all([
      providers().upload({ buffer: webp, mimeType: 'image/webp' }, { folder, publicId: `${target.size}-webp`, format: 'webp' }),
      providers().upload({ buffer: jpg, mimeType: 'image/jpeg' }, { folder, publicId: `${target.size}-jpg`, format: 'jpg' }),
    ]);
    assets.push({ size: target.size, width: target.width, height: target.height, webpUrl: w.url, jpgUrl: j.url, bytes: { webp: webp.length, jpg: jpg.length }, method });
  }
  maybeCrash('pack');

  const text = await altText({ requestId: option.requestId, optionId: option.id, altTextSeed: brief.altTextSeed, idea: direction.idea, title: direction.title, styleLabel: style.label, seen: '' });
  await db.publishPack.upsert({
    where: { optionId: option.id },
    create: { optionId: option.id, assets: assets as object, altText: text.altText, caption: text.caption, credit, status: 'READY' },
    update: { assets: assets as object, altText: text.altText, caption: text.caption, credit, status: 'READY' },
  });
  if (await moveOption(option.id, 'PACK_READY', {}, ['PACKING'])) emitPackReady(option.request.publicId, option.id);
}

export async function failPack(optionId: string, reason = 'The publish pack could not be made. Try again.'): Promise<void> {
  const option = await db.option.findUnique({ where: { id: optionId }, select: { request: { select: { publicId: true } } } });
  if (!option) return;
  if (await moveOption(optionId, 'PACK_FAILED', { failureReason: reason }, ['PACKING'])) {
    await db.publishPack.updateMany({ where: { optionId }, data: { status: 'FAILED' } });
    emitOptionFailed(option.request.publicId, optionId, 'PACK_FAILED', reason);
  }
}
