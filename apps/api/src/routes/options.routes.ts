import type { PackAsset } from '@editorial-art/shared-types';
import { Router, type Request } from 'express';
import { strToU8, zipSync } from 'fflate';
import { asyncRoute } from '../lib/async-route';
import { audit } from '../lib/audit';
import { db } from '../lib/db';
import { ApiError } from '../lib/errors';
import { isUuid } from '../lib/ids';
import { referencesByIds } from '../library/references';
import { ESTIMATE_INR, imageEstimateInr } from '../lib/pricing';
import { imageModels } from '../lib/settings';

/** One final by the chosen model and size, plus its judge. */
async function finalEstimateInr(): Promise<number> {
  const { finalModel, finalImageSize } = await imageModels();
  return imageEstimateInr(finalModel, finalImageSize) + ESTIMATE_INR.judge;
}
import { assertCanSpend, SpendCapError } from '../lib/spend-guard';
import { actorOf } from '../middleware/actor';
import { rateLimit } from '../middleware/rate-limit';
import { moveOption } from '../pipeline/state';
import { providers } from '../providers';
import { enqueue } from '../queues/queues';
import { optionDto, packDto } from './views';

export const optionsRouter = Router();

/** An option whose request is in the caller's workspace (or any, for an admin). */
async function findOwnedOption(req: Request) {
  const id = req.params.optionId;
  if (!id || !isUuid(id)) throw ApiError.notFound('Option not found.');
  const actor = actorOf(req);
  const option = await db.option.findFirst({
    where: { id, ...(actor.role === 'admin' ? {} : { request: { actorWorkspaceId: actor.workspaceId } }) },
    include: { pack: true, request: { select: { publicId: true, status: true } } },
  });
  if (!option) throw ApiError.notFound('Option not found.');
  return option;
}

optionsRouter.get(
  '/options/:optionId',
  asyncRoute(async (req, res) => {
    const option = await findOwnedOption(req);
    const [styles, refs] = await Promise.all([db.style.findMany({ where: { id: option.styleId } }), referencesByIds(option.referenceIds)]);
    res.json(optionDto(option, new Map(styles.map((s) => [s.id, s])), refs));
  })
);

optionsRouter.post(
  '/options/:optionId/finalize',
  rateLimit('finalize'),
  asyncRoute(async (req, res) => {
    const option = await findOwnedOption(req);
    if (option.request.status === 'CANCELLED' || option.request.status === 'EXPIRED') throw ApiError.invalidState('This request has ended.');
    if (option.state === 'FINALIZING' || option.state === 'FINAL_READY' || option.state === 'PACKING' || option.state === 'PACK_READY') {
      res.status(200).json({ optionId: option.id, state: option.state });
      return;
    }
    await assertCanSpend(await finalEstimateInr(), option.requestId).catch((error: unknown) => {
      if (error instanceof SpendCapError) throw new ApiError(error.code, 429, error.message, { scope: error.scope });
      throw error;
    });
    const moved = await moveOption(option.id, 'FINALIZING', { picked: true, pickedAt: new Date(), failureReason: null }, ['PREVIEW_READY', 'FINAL_FAILED']);
    if (!moved) throw ApiError.invalidState('This option has no preview to finish yet.');
    await enqueue.finalize({ optionId: option.id }, option.finalAttempts + 1);
    await audit({ action: 'option.finalize', targetType: 'option', targetId: option.id, actorUserId: actorOf(req).userId, metadata: { requestId: option.request.publicId } });
    res.status(202).json({ optionId: option.id, state: 'FINALIZING' });
  })
);

optionsRouter.post(
  '/options/:optionId/pack',
  asyncRoute(async (req, res) => {
    const option = await findOwnedOption(req);
    if (option.state !== 'PACK_FAILED') throw ApiError.invalidState('The pack is not in a state that can be made again.');
    await enqueue.pack({ optionId: option.id }, Date.now());
    res.status(202).json({ optionId: option.id, state: option.state });
  })
);

optionsRouter.get(
  '/options/:optionId/pack',
  asyncRoute(async (req, res) => {
    const option = await findOwnedOption(req);
    if (!option.pack || option.pack.status !== 'READY') throw new ApiError('PACK_NOT_READY', 409, 'The publish pack is not ready yet.');
    res.json(packDto(option.pack));
  })
);

/** A ZIP built on the fly: every size as the PNG master, JPG and WebP, plus the alt text, caption and credit. */
optionsRouter.get(
  '/options/:optionId/pack.zip',
  asyncRoute(async (req, res) => {
    const option = await findOwnedOption(req);
    if (!option.pack || option.pack.status !== 'READY') throw new ApiError('PACK_NOT_READY', 409, 'The publish pack is not ready yet.');
    const assets = option.pack.assets as unknown as PackAsset[];
    const files: Record<string, Uint8Array> = {};
    let total = 0;
    for (const asset of assets) {
      const formats = [['png', asset.pngUrl], ['jpg', asset.jpgUrl], ['webp', asset.webpUrl]] as const;
      for (const [ext, url] of formats) {
        if (!url) continue;
        // As stored: a transform would re-encode the master.
        const image = await providers().fetchImage(url, 0);
        total += image.buffer.length;
        if (total > 80 * 1024 * 1024) throw new ApiError('PACK_TOO_LARGE', 413, 'The pack is too large to zip. Download sizes one at a time.');
        files[`${option.request.publicId}-${asset.size}.${ext}`] = new Uint8Array(image.buffer);
      }
    }
    files['README.txt'] = strToU8(`Alt text: ${option.pack.altText}\nCaption: ${option.pack.caption}\nCredit: ${option.pack.credit}\n`);
    const zip = zipSync(files, { level: 0 });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${option.request.publicId}-pack.zip"`);
    res.setHeader('Content-Length', String(zip.length));
    res.end(Buffer.from(zip));
  })
);
