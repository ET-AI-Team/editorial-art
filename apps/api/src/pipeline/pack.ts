import { AltTextOutput, type PackAsset } from '@editorial-art/shared-types';
import sharp from 'sharp';
import { db } from '../lib/db';
import { env } from '../lib/env';
import { StageError } from '../lib/errors';
import { toJpeg, toPng, toWebp } from '../lib/image';
import { ESTIMATE_INR } from '../lib/pricing';
import { styleById } from '../library/styles';
import { BadModelOutput, providers } from '../providers';
import { chat, maybeCrash } from './ai';
import { emitOptionFailed, emitPackReady } from './events';
import { logoCredits } from './brand-logo';
import { faceCredits, withFaceCredits } from './people';
import { ALT_TEXT_SYSTEM, buildAltTextUser } from './prompts';
import { moveOption } from './state';

/**
 * Stage 5: the publish pack for a finalized option. ET Articles uses one square image, so this is
 * the final at the size it was made (2048 at 2K, larger at 4K) as a lossless PNG master and a JPG
 * at quality 95 (both with the credit line written in as the copyright), and a WebP at quality 95
 * for the web, plus alt text, a caption and the credit.
 */

/** Large enough for any final; the master is fetched as stored, without a delivery transform. */
const MAX_SIDE = 4096;
const QUALITY = 95;

async function altText(ctx: { requestId: string; optionId: string; altTextSeed: string; idea: string; title: string; styleLabel: string }) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await chat(
        { stage: 'pack_text', requestId: ctx.requestId, optionId: ctx.optionId },
        { kind: 'alt_text', model: env().EA_TEXT_MODEL, system: ALT_TEXT_SYSTEM, user: buildAltTextUser({ ...ctx, seen: '' }), temperature: 0.3, maxTokens: 300 },
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

  const master = (await providers().fetchImage(option.finalUrl, 0)).buffer;
  const meta = await sharp(master).metadata();
  const side = Math.min(MAX_SIDE, meta.width ?? MAX_SIDE, meta.height ?? MAX_SIDE);
  const square = await sharp(master).resize(side, side, { fit: 'cover' }).png().toBuffer();

  // A face drawn from a Commons photo credits that photo: "Face reference: {author}, Wikimedia Commons, {licence}";
  // an official logo credits its owner: "Logo: {name} (trademark of its owner), via Wikimedia Commons".
  const credit = withFaceCredits(env().EA_CREDIT_LINE, [...(await faceCredits(option.likenessIds)), ...(await logoCredits(option.brandLogoId))]);
  const [png, webp, jpg] = await Promise.all([toPng(square, { copyright: credit }), toWebp(square, { quality: QUALITY }), toJpeg(square, { quality: QUALITY, copyright: credit })]);
  const folder = `${env().EA_CLOUDINARY_FOLDER}/${option.request.publicId}/pack/${option.id}`;
  const [p, w, j] = await Promise.all([
    providers().upload({ buffer: png, mimeType: 'image/png' }, { folder, publicId: '1x1-png', format: 'png' }),
    providers().upload({ buffer: webp, mimeType: 'image/webp' }, { folder, publicId: '1x1-webp', format: 'webp' }),
    providers().upload({ buffer: jpg, mimeType: 'image/jpeg' }, { folder, publicId: '1x1-jpg', format: 'jpg' }),
  ]);
  const assets: PackAsset[] = [
    { size: '1x1', width: side, height: side, webpUrl: w.url, jpgUrl: j.url, pngUrl: p.url, bytes: { webp: webp.length, jpg: jpg.length, png: png.length }, method: 'resize' },
  ];
  maybeCrash('pack');

  const text = await altText({ requestId: option.requestId, optionId: option.id, altTextSeed: brief.altTextSeed, idea: direction.idea, title: direction.title, styleLabel: style.label });
  await db.publishPack.upsert({
    where: { optionId: option.id },
    create: { optionId: option.id, assets: assets as object, altText: text.altText, caption: text.caption, credit, status: 'READY' },
    update: { assets: assets as object, altText: text.altText, caption: text.caption, credit, status: 'READY' },
  });
  if (await moveOption(option.id, 'PACK_READY', {}, ['PACKING'])) emitPackReady(option.request.publicId, option.id);
}

export async function failPack(optionId: string, reason = 'The download could not be prepared. Try again.'): Promise<void> {
  const option = await db.option.findUnique({ where: { id: optionId }, select: { request: { select: { publicId: true } } } });
  if (!option) return;
  if (await moveOption(optionId, 'PACK_FAILED', { failureReason: reason }, ['PACKING'])) {
    await db.publishPack.updateMany({ where: { optionId }, data: { status: 'FAILED' } });
    emitOptionFailed(option.request.publicId, optionId, 'PACK_FAILED', reason);
  }
}
