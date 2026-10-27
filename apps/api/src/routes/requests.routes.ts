import {
  ARTICLE_MAX_CHARS,
  ARTICLE_MIN_CHARS,
  CreateBatchBody,
  CreateRequestBody,
  PhotoAdviceBody,
  RequestListQuery,
  type CreateBatchBody as CreateBatchBodyT,
  type CreateRequestBody as CreateRequestBodyT,
  type PhotoAdviceBody as PhotoAdviceBodyT,
  type SensitivityLevel,
} from '@editorial-art/shared-types';
import { Router, type Request } from 'express';
import { asyncRoute } from '../lib/async-route';
import { audit } from '../lib/audit';
import { db } from '../lib/db';
import { env } from '../lib/env';
import { ApiError, StageError } from '../lib/errors';
import { sha256 } from '../lib/hash';
import { isPublicRequestId, newPublicRequestId } from '../lib/ids';
import { assertCanSpend } from '../lib/spend-guard';
import { detectLang, excerpt, normaliseArticle } from '../lib/text';
import { liveStyles, styleAllowed } from '../library/styles';
import { actorOf } from '../middleware/actor';
import { hitLimit, rateLimit } from '../middleware/rate-limit';
import { parseQuery, validateBody } from '../middleware/validate';
import { advisePhoto, SAFE_ADVICE } from '../pipeline/advice';
import { createBatch, validatePin } from '../pipeline/batches';
import { emitRequestStatus } from '../pipeline/events';
import { moveRequest } from '../pipeline/state';
import { enqueue } from '../queues/queues';
import { listItem, requestDetail } from './views';
import { ESTIMATE_INR } from '../lib/pricing';

export const requestsRouter = Router();

/** A request in the caller's workspace, by public id. Another workspace's request is a 404. */
export async function findOwned(req: Request, publicId: string | undefined) {
  if (!publicId || !isPublicRequestId(publicId)) throw ApiError.notFound('Request not found.');
  const actor = actorOf(req);
  const row = await db.request.findFirst({ where: { publicId, ...(actor.role === 'admin' ? {} : { actorWorkspaceId: actor.workspaceId }) } });
  if (!row) throw ApiError.notFound('Request not found.');
  return row;
}

async function loadDetail(id: string) {
  const r = await db.request.findUniqueOrThrow({
    where: { id },
    include: { briefs: { include: { directions: true } }, batches: { include: { options: { include: { pack: true } } } } },
  });
  const styles = await db.style.findMany();
  const level = (r.sensitivity ?? 'NONE') as SensitivityLevel;
  const allowed = (await liveStyles()).filter((s) => styleAllowed(s, level)).map((s) => s.id);
  return requestDetail(r, new Map(styles.map((s) => [s.id, s])), allowed);
}

function stageToApi(error: unknown): never {
  if (error instanceof StageError) {
    const status = { NOT_FOUND: 404, SERIES_NOT_FOUND: 404, VALIDATION_ERROR: 400, STYLE_NOT_LIVE: 400, STYLE_NOT_ALLOWED_FOR_STORY: 400, SPEND_CAP_REACHED: 429 }[error.code] ?? 409;
    throw new ApiError(error.code, status, error.message);
  }
  throw error;
}

requestsRouter.post(
  '/requests',
  rateLimit('create'),
  validateBody(CreateRequestBody),
  asyncRoute(async (req, res) => {
    const actor = actorOf(req);
    const body = req.body as CreateRequestBodyT;
    const config = env();

    if (body.clientRef) {
      const existing = await db.request.findUnique({ where: { callerKeyId_clientRef: { callerKeyId: req.callerKeyId!, clientRef: body.clientRef } } });
      if (existing) {
        res.status(200).json({ requestId: existing.publicId, status: existing.status, createdAt: existing.createdAt.toISOString() });
        return;
      }
    }

    // Length rules apply to the cleaned text, not the pasted text.
    const article = normaliseArticle(body.articleText, body.articleTitle);
    if (article.text.length < ARTICLE_MIN_CHARS) {
      throw new ApiError('ARTICLE_TOO_SHORT', 400, 'Paste the full article: at least a few paragraphs.', { fieldErrors: { articleText: ['too short after cleaning'] } });
    }
    if (article.text.length > ARTICLE_MAX_CHARS) throw new ApiError('ARTICLE_TOO_LONG', 400, 'This is longer than 40,000 characters. Paste the main story only.');

    if (body.styleId) {
      const style = await db.style.findUnique({ where: { id: body.styleId } });
      if (!style || style.status !== 'LIVE') throw new ApiError('STYLE_NOT_LIVE', 400, 'That style is not available.');
    }
    if (body.pinnedReferenceId) {
      if (!body.styleId) {
        throw ApiError.validation({ fieldErrors: { pinnedReferenceId: ['needs styleId'] } }, 'A pinned reference needs its style: send styleId as well.');
      }
      await validatePin(body.pinnedReferenceId, body.styleId).catch(stageToApi);
    }
    if (body.seriesOfRequestId) {
      const series = await db.request.findFirst({ where: { publicId: body.seriesOfRequestId, actorWorkspaceId: actor.workspaceId } });
      if (!series) throw new ApiError('SERIES_NOT_FOUND', 404, 'Pick a previous story from this workspace.');
    }

    const busy = await db.request.count({ where: { actorUserId: actor.userId, status: { in: ['RECEIVED', 'READING'] } } });
    if (busy >= config.EA_USER_CONCURRENT_REQUESTS) {
      throw new ApiError('USER_BUSY', 429, 'You already have articles being read. Wait for one to finish.', { retryAfterSec: 15 });
    }
    await assertCanSpend(ESTIMATE_INR.read + 4 * ESTIMATE_INR.previewImage).catch(stageToApi);

    const now = new Date();
    const row = await db.request.create({
      data: {
        publicId: newPublicRequestId(),
        callerKeyId: req.callerKeyId!,
        actorUserId: actor.userId,
        actorWorkspaceId: actor.workspaceId,
        clientRef: body.clientRef ?? null,
        articleTitle: article.title,
        articleText: article.text,
        articleHash: sha256(article.text),
        articleChars: article.text.length,
        articleLang: detectLang(article.text),
        articleExcerpt: excerpt(article.text, 400),
        prompt: body.prompt?.trim() || null,
        styleId: body.styleId ?? null,
        pinnedReferenceId: body.pinnedReferenceId ?? null,
        seriesOfRequestId: body.seriesOfRequestId ?? null,
        spendCapInr: config.EA_REQUEST_SPEND_CAP_INR,
        expiresAt: new Date(now.getTime() + config.EA_ARTICLE_RETENTION_DAYS * 86_400_000),
      },
    });
    await enqueue.read({ requestId: row.id });
    await audit({ action: 'request.create', targetType: 'request', targetId: row.publicId, actorUserId: actor.userId, callerKeyId: req.callerKeyId, metadata: { chars: row.articleChars, removedLines: article.removedLines, styleId: row.styleId, pinnedReferenceId: row.pinnedReferenceId } });
    req.log?.info({ eaRequestId: row.publicId, chars: row.articleChars }, 'request_created');
    res.status(202).json({ requestId: row.publicId, status: row.status, createdAt: row.createdAt.toISOString() });
  })
);

/**
 * The real-photo advisor, asked before POST /requests. Nothing is stored. Always a 200: any failure
 * (model error, timeout, spend cap, or this route's own per-user limit) answers "no suggestion" so
 * the editor carries on exactly as before. See pipeline/advice.ts.
 */
requestsRouter.post(
  '/requests/photo-advice',
  validateBody(PhotoAdviceBody),
  asyncRoute(async (req, res) => {
    const actor = actorOf(req);
    const body = req.body as PhotoAdviceBodyT;
    const limit = await hitLimit(`advice:u:${actor.userId}`, 2 * env().EA_RATE_CREATE_PER_HOUR).catch(() => ({ allowed: true }));
    const advice = limit.allowed ? await advisePhoto({ title: body.title, text: body.text }) : SAFE_ADVICE;
    req.log?.info({ suggestPhoto: advice.suggestPhoto, kind: advice.kind, limited: !limit.allowed }, 'photo_advice');
    res.json(advice);
  })
);

requestsRouter.get(
  '/requests',
  asyncRoute(async (req, res) => {
    const actor = actorOf(req);
    const query = parseQuery(RequestListQuery, req.query);
    const cursor = query.cursor && isPublicRequestId(query.cursor) ? await db.request.findUnique({ where: { publicId: query.cursor }, select: { createdAt: true } }) : null;
    const rows = await db.request.findMany({
      where: { actorWorkspaceId: actor.workspaceId, ...(cursor ? { createdAt: { lt: cursor.createdAt } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      include: { options: { select: { previewUrl: true, finalUrl: true, picked: true }, orderBy: { createdAt: 'asc' } } },
    });
    const page = rows.slice(0, query.limit);
    res.json({ items: page.map(listItem), nextCursor: rows.length > query.limit ? page[page.length - 1]!.publicId : null });
  })
);

requestsRouter.get(
  '/requests/:requestId',
  asyncRoute(async (req, res) => {
    const row = await findOwned(req, req.params.requestId);
    res.json(await loadDetail(row.id));
  })
);

requestsRouter.get(
  '/requests/:requestId/article',
  asyncRoute(async (req, res) => {
    const row = await findOwned(req, req.params.requestId);
    if (!row.articleText) throw new ApiError('EXPIRED', 410, 'The article text is no longer kept for this request.');
    res.json({ title: row.articleTitle, text: row.articleText });
  })
);

requestsRouter.post(
  '/requests/:requestId/cancel',
  asyncRoute(async (req, res) => {
    const row = await findOwned(req, req.params.requestId);
    if (!(await moveRequest(row.id, 'CANCELLED'))) throw ApiError.invalidState('This request has already finished.');
    await db.batch.updateMany({ where: { requestId: row.id, status: { in: ['QUEUED', 'RUNNING'] } }, data: { status: 'CANCELLED', completedAt: new Date() } });
    await db.option.updateMany({ where: { requestId: row.id, state: { in: ['PENDING', 'GENERATING'] } }, data: { state: 'PREVIEW_FAILED', failureReason: 'Cancelled.' } });
    emitRequestStatus(row.publicId, 'CANCELLED');
    await audit({ action: 'request.cancel', targetType: 'request', targetId: row.publicId, actorUserId: actorOf(req).userId });
    res.json({ status: 'CANCELLED' });
  })
);

requestsRouter.post(
  '/requests/:requestId/batches',
  rateLimit('batch'),
  validateBody(CreateBatchBody),
  asyncRoute(async (req, res) => {
    const row = await findOwned(req, req.params.requestId);
    const body = req.body as CreateBatchBodyT;
    const actor = actorOf(req);
    await assertCanSpend(4 * ESTIMATE_INR.previewImage, row.id).catch(stageToApi);
    const created = await createBatch({
      requestId: row.id,
      kind: body.kind,
      requestedBy: actor.userId,
      ...(body.kind === 'ANOTHER_STYLE' ? { styleId: body.styleId, pinnedReferenceId: body.pinnedReferenceId } : {}),
      ...(body.kind === 'MORE' ? { fromOptionId: body.fromOptionId, fromBatchId: body.fromBatchId } : {}),
      ...(body.kind === 'SERIES_MATCH' ? { seriesOfRequestId: body.seriesOfRequestId } : {}),
    }).catch(stageToApi);
    await audit({ action: 'batch.create', targetType: 'request', targetId: row.publicId, actorUserId: actor.userId, metadata: { kind: body.kind, batchId: created.batchId, ...(body.kind === 'ANOTHER_STYLE' && body.pinnedReferenceId ? { pinnedReferenceId: body.pinnedReferenceId } : {}) } });
    res.status(202).json({ batchId: created.batchId, seq: created.seq, status: 'QUEUED' });
  })
);
