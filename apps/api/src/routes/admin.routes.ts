import {
  AdminReference,
  AdminStyleRow,
  BulkReviewBody,
  GenerateExemplarsBody,
  LikenessBody,
  PatchStyleBody,
  RefStatus,
  ReviewReferenceBody,
  type AdminReference as AdminReferenceT,
  type AdminStyleRow as AdminStyleRowT,
} from '@editorial-art/shared-types';
import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import multer from 'multer';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { z } from 'zod';
import { audit } from '../lib/audit';
import { db } from '../lib/db';
import { env } from '../lib/env';
import { ApiError } from '../lib/errors';
import { spendSummary } from '../lib/spend-guard';
import { EXEMPLAR_ESTIMATE_INR, NEUTRAL_SUBJECTS, libraryFolder, slugify, toLibraryWebp } from '../library/exemplars';
import { styleById, toStyleView } from '../library/styles';
import { actorOf, requireAdmin } from '../middleware/actor';
import { rateLimit } from '../middleware/rate-limit';
import { parseQuery, validateBody } from '../middleware/validate';
import { providers } from '../providers';
import { enqueue } from '../queues/queues';

/**
 * Admin: the style library (Step 5.8), likenesses and spend. Every route needs the admin role;
 * AI Studio enforces the same on its side.
 */
export const adminRouter = Router();
adminRouter.use('/admin', requireAdmin);

/** Express 4 does not catch async errors; this passes them to the error handler. */
function wrap(handler: (req: Request, res: Response) => Promise<void>): RequestHandler {
  return (req, res, next: NextFunction) => {
    handler(req, res).catch(next);
  };
}

const UuidParam = z.string().uuid();

function idParam(req: Request, name = 'id'): string {
  const parsed = UuidParam.safeParse(req.params[name]);
  if (!parsed.success) throw ApiError.notFound();
  return parsed.data;
}

// ---- styles --------------------------------------------------------------------------------

type Counts = { candidate: number; approved: number; rejected: number };

async function referenceCounts(styleIds: string[]): Promise<Map<string, Counts>> {
  const groups = await db.styleReference.groupBy({ by: ['styleId', 'status'], where: { styleId: { in: styleIds } }, _count: { _all: true } });
  const counts = new Map<string, Counts>();
  for (const id of styleIds) counts.set(id, { candidate: 0, approved: 0, rejected: 0 });
  for (const g of groups) {
    const c = counts.get(g.styleId)!;
    if (g.status === 'CANDIDATE') c.candidate = g._count._all;
    if (g.status === 'APPROVED') c.approved = g._count._all;
    if (g.status === 'REJECTED') c.rejected = g._count._all;
  }
  return counts;
}

async function styleRows(where: { id?: string } = {}): Promise<AdminStyleRowT[]> {
  const rows = await db.style.findMany({ where, include: { family: true }, orderBy: [{ sortOrder: 'asc' }] });
  const counts = await referenceCounts(rows.map((r) => r.id));
  return rows.map((row) => {
    const view = toStyleView(row);
    return AdminStyleRow.parse({
      id: view.id,
      slug: view.slug,
      label: view.label,
      familySlug: view.familySlug,
      status: view.status,
      summary: view.summary,
      goodFor: view.goodFor,
      safety: view.safety,
      ruleSheet: view.ruleSheet,
      counts: counts.get(view.id),
      minApprovedRefs: view.minApprovedRefs,
      coverReferenceIds: view.coverReferenceIds,
      sortOrder: view.sortOrder,
    });
  });
}

async function styleRow(id: string): Promise<AdminStyleRowT> {
  const [row] = await styleRows({ id });
  if (!row) throw ApiError.notFound('No such style.');
  return row;
}

adminRouter.get(
  '/admin/styles',
  wrap(async (_req, res) => {
    res.json({ styles: await styleRows() });
  })
);

adminRouter.patch(
  '/admin/styles/:id',
  validateBody(PatchStyleBody),
  wrap(async (req, res) => {
    const id = idParam(req);
    const body = req.body as z.infer<typeof PatchStyleBody>;
    if (!(await db.style.findUnique({ where: { id }, select: { id: true } }))) throw ApiError.notFound('No such style.');
    if (body.coverReferenceIds?.length) {
      const approved = await db.styleReference.count({ where: { id: { in: body.coverReferenceIds }, styleId: id, status: 'APPROVED' } });
      if (approved !== new Set(body.coverReferenceIds).size) throw ApiError.validation(null, 'Covers must be approved references of this style.');
    }
    await db.style.update({
      where: { id },
      data: {
        ...(body.summary !== undefined ? { summary: body.summary } : {}),
        ...(body.ruleSheet !== undefined ? { ruleSheet: body.ruleSheet } : {}),
        ...(body.goodFor !== undefined ? { goodFor: body.goodFor } : {}),
        ...(body.safety !== undefined ? { safety: body.safety } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.coverReferenceIds !== undefined ? { coverReferenceIds: body.coverReferenceIds } : {}),
      },
    });
    const actor = actorOf(req);
    await audit({ action: 'style.update', targetType: 'style', targetId: id, actorUserId: actor.userId, callerKeyId: req.callerKeyId, metadata: { fields: Object.keys(body) } });
    res.json(await styleRow(id));
  })
);

adminRouter.post(
  '/admin/styles/:id/generate',
  rateLimit('library'),
  validateBody(GenerateExemplarsBody),
  wrap(async (req, res) => {
    const id = idParam(req);
    const body = req.body as z.infer<typeof GenerateExemplarsBody>;
    const style = await styleById(id);
    if (!style) throw ApiError.notFound('No such style.');
    if (style.status === 'RETIRED') throw ApiError.invalidState('This style is retired.');

    const subjects = [...new Set(body.subjects ?? NEUTRAL_SUBJECTS)];
    const stamp = Date.now();
    for (const subject of subjects) {
      await enqueue.library({ kind: 'exemplar', styleId: id, subject, useApprovedAsRefs: body.useApprovedAsRefs }, `${id}-${slugify(subject)}-${stamp}`);
    }
    if (style.status === 'DRAFT') await db.style.update({ where: { id }, data: { status: 'CURATING' } });

    const estimatedCostInr = Math.round(subjects.length * EXEMPLAR_ESTIMATE_INR * 100) / 100;
    const actor = actorOf(req);
    await audit({
      action: 'style.generate',
      targetType: 'style',
      targetId: id,
      actorUserId: actor.userId,
      callerKeyId: req.callerKeyId,
      metadata: { queued: subjects.length, useApprovedAsRefs: body.useApprovedAsRefs, estimatedCostInr },
    });
    res.status(202).json({ queued: subjects.length, estimatedCostInr });
  })
);

adminRouter.post(
  '/admin/styles/:id/publish',
  wrap(async (req, res) => {
    const id = idParam(req);
    const style = await db.style.findUnique({ where: { id } });
    if (!style) throw ApiError.notFound('No such style.');
    const approved = await db.styleReference.count({ where: { styleId: id, status: 'APPROVED' } });
    if (approved < style.minApprovedRefs) {
      throw new ApiError('STYLE_NOT_READY', 409, `This style needs ${style.minApprovedRefs} approved references before it can go live. It has ${approved}.`, {
        approved,
        required: style.minApprovedRefs,
      });
    }
    let covers = style.coverReferenceIds;
    if (covers.length === 0) {
      const picked = await db.styleReference.findMany({
        where: { styleId: id, status: 'APPROVED' },
        orderBy: [{ pickCount: 'desc' }, { createdAt: 'asc' }],
        take: 3,
        select: { id: true },
      });
      covers = picked.map((p) => p.id);
    }
    await db.style.update({ where: { id }, data: { status: 'LIVE', coverReferenceIds: covers, retiredAt: null } });
    const actor = actorOf(req);
    await audit({ action: 'style.publish', targetType: 'style', targetId: id, actorUserId: actor.userId, callerKeyId: req.callerKeyId, metadata: { approved } });
    res.json(await styleRow(id));
  })
);

adminRouter.post(
  '/admin/styles/:id/retire',
  wrap(async (req, res) => {
    const id = idParam(req);
    if (!(await db.style.findUnique({ where: { id }, select: { id: true } }))) throw ApiError.notFound('No such style.');
    // Existing requests keep their images; the style just stops being offered.
    await db.style.update({ where: { id }, data: { status: 'RETIRED', retiredAt: new Date() } });
    const actor = actorOf(req);
    await audit({ action: 'style.retire', targetType: 'style', targetId: id, actorUserId: actor.userId, callerKeyId: req.callerKeyId });
    res.json(await styleRow(id));
  })
);

// ---- references ----------------------------------------------------------------------------

type ReferenceRow = Awaited<ReturnType<typeof db.styleReference.findMany>>[number];

const Screen = z.object({ passed: z.boolean(), reason: z.string() });

function toAdminReference(r: ReferenceRow): AdminReferenceT {
  const screen = Screen.safeParse(r.screen);
  return AdminReference.parse({
    id: r.id,
    styleId: r.styleId,
    source: r.source,
    url: r.url,
    width: r.width,
    height: r.height,
    description: r.description,
    subjects: r.subjects,
    mood: r.mood,
    status: r.status,
    screen: screen.success ? screen.data : null,
    reviewNote: r.reviewNote,
    usageCount: r.usageCount,
    pickCount: r.pickCount,
    createdAt: r.createdAt.toISOString(),
  });
}

const PAGE_SIZE = 60;
const ReferenceQuery = z
  .object({
    styleId: z.string().uuid().optional(),
    status: RefStatus.optional(),
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(PAGE_SIZE).default(PAGE_SIZE),
  })
  .strict();

adminRouter.get(
  '/admin/references',
  wrap(async (req, res) => {
    const q = parseQuery(ReferenceQuery, req.query);
    const rows = await db.styleReference.findMany({
      where: { ...(q.styleId ? { styleId: q.styleId } : {}), ...(q.status ? { status: q.status } : {}) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });
    const page = rows.slice(0, q.limit);
    res.json({ items: page.map(toAdminReference), nextCursor: rows.length > q.limit ? (page[page.length - 1]?.id ?? null) : null });
  })
);

/** A rejected or retired reference can no longer be a style's cover. */
async function dropFromCovers(referenceIds: string[]): Promise<void> {
  const styles = await db.style.findMany({ where: { coverReferenceIds: { hasSome: referenceIds } }, select: { id: true, coverReferenceIds: true } });
  for (const s of styles) {
    await db.style.update({ where: { id: s.id }, data: { coverReferenceIds: s.coverReferenceIds.filter((c) => !referenceIds.includes(c)) } });
  }
}

adminRouter.post(
  '/admin/references/bulk-review',
  validateBody(BulkReviewBody),
  wrap(async (req, res) => {
    const body = req.body as z.infer<typeof BulkReviewBody>;
    const actor = actorOf(req);
    const ids = [...new Set(body.ids)];
    const { count } = await db.styleReference.updateMany({
      where: { id: { in: ids }, status: { not: 'RETIRED' } },
      data: { status: body.decision, reviewedBy: actor.userId, reviewedAt: new Date(), ...(body.note !== undefined ? { reviewNote: body.note } : {}) },
    });
    if (body.decision === 'REJECTED') await dropFromCovers(ids);
    await audit({
      action: 'reference.review',
      targetType: 'reference',
      targetId: 'bulk',
      actorUserId: actor.userId,
      callerKeyId: req.callerKeyId,
      metadata: { decision: body.decision, ids, updated: count },
    });
    res.json({ updated: count });
  })
);

adminRouter.post(
  '/admin/references/:id/review',
  validateBody(ReviewReferenceBody),
  wrap(async (req, res) => {
    const id = idParam(req);
    const body = req.body as z.infer<typeof ReviewReferenceBody>;
    const actor = actorOf(req);
    const existing = await db.styleReference.findUnique({ where: { id }, select: { status: true } });
    if (!existing) throw ApiError.notFound('No such reference.');
    if (existing.status === 'RETIRED') throw ApiError.invalidState('This reference is retired.');
    const note = body.note ?? (body.reasonChip ? `Rejected: ${body.reasonChip}` : null);
    const updated = await db.styleReference.update({
      where: { id },
      data: { status: body.decision, reviewedBy: actor.userId, reviewedAt: new Date(), ...(note !== null ? { reviewNote: note } : {}) },
    });
    if (body.decision === 'REJECTED') await dropFromCovers([id]);
    await audit({
      action: 'reference.review',
      targetType: 'reference',
      targetId: id,
      actorUserId: actor.userId,
      callerKeyId: req.callerKeyId,
      metadata: { decision: body.decision, reasonChip: body.reasonChip ?? null },
    });
    res.json(toAdminReference(updated));
  })
);

const MB = 1024 * 1024;
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp']);

/** Runs multer and turns its errors (too large, too many files) into a clear 400. */
function multipart(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    handler(req, res, (err?: unknown) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE' ? 'That file is too large.' : `The upload was not accepted (${err.code.toLowerCase().replace(/_/g, ' ')}).`;
        return next(new ApiError('UPLOAD_INVALID', 400, message));
      }
      next(err);
    });
  };
}

const referenceUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * MB, files: 1, fields: 10 } }).single('image');
const likenessUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * MB, files: 4, fields: 20 } }).array('photos', 4);

/** The type is read from the bytes, never trusted from the file name or header. */
async function sniffImage(buffer: Buffer): Promise<void> {
  const meta = await sharp(buffer)
    .metadata()
    .catch(() => null);
  if (!meta?.format || !ALLOWED_FORMATS.has(meta.format) || !meta.width || !meta.height) {
    throw new ApiError('UPLOAD_INVALID', 400, 'Upload a JPG, PNG or WebP image.');
  }
}

const UploadFields = z
  .object({
    styleId: z.string().uuid(),
    source: z.enum(['ET_ARCHIVE', 'LICENSED']),
    sourceNote: z.string().trim().min(3).max(500),
  })
  .strict();

adminRouter.post(
  '/admin/references/upload',
  multipart(referenceUpload),
  wrap(async (req, res) => {
    const fields = UploadFields.safeParse(req.body);
    if (!fields.success) throw ApiError.validation(fields.error.flatten());
    if (!req.file) throw new ApiError('UPLOAD_INVALID', 400, 'Attach an image in the "image" field.');
    await sniffImage(req.file.buffer);
    const style = await styleById(fields.data.styleId);
    if (!style) throw ApiError.notFound('No such style.');

    const image = await toLibraryWebp(req.file.buffer);
    const uploaded = await providers().upload(image, {
      folder: libraryFolder(style.slug),
      publicId: `${fields.data.source.toLowerCase().replace('_', '-')}-${randomBytes(6).toString('hex')}`,
      format: 'webp',
      tags: ['library', `style:${style.slug}`, fields.data.source.toLowerCase()],
    });
    const reference = await db.styleReference.create({
      data: {
        styleId: style.id,
        source: fields.data.source,
        sourceNote: fields.data.sourceNote,
        url: uploaded.url,
        publicId: uploaded.publicId,
        width: uploaded.width,
        height: uploaded.height,
        description: '',
        subjects: [],
        mood: '',
      },
    });
    await enqueue.library({ kind: 'describe', referenceId: reference.id }, `describe-${reference.id}`);
    const actor = actorOf(req);
    await audit({
      action: 'reference.upload',
      targetType: 'reference',
      targetId: reference.id,
      actorUserId: actor.userId,
      callerKeyId: req.callerKeyId,
      metadata: { styleId: style.id, source: fields.data.source },
    });
    res.status(201).json(toAdminReference(reference));
  })
);

// ---- likenesses ----------------------------------------------------------------------------

const Photo = z.object({ url: z.string(), publicId: z.string(), width: z.number(), height: z.number() });
type LikenessRow = Awaited<ReturnType<typeof db.likeness.findMany>>[number];

function toLikenessDto(l: LikenessRow) {
  const photos = z.array(Photo).safeParse(l.photos);
  return {
    id: l.id,
    name: l.name,
    aliases: l.aliases,
    photos: (photos.success ? photos.data : []).map((p) => ({ url: p.url, width: p.width, height: p.height })),
    consentNote: l.consentNote,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
  };
}

/** Multipart sends aliases as a JSON array, repeated fields, or one comma-separated string. */
function parseAliases(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof raw !== 'string' || !raw.trim()) return [];
  const text = raw.trim();
  if (text.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
    } catch {
      // Falls through to comma splitting.
    }
  }
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

adminRouter.get(
  '/admin/likenesses',
  wrap(async (_req, res) => {
    const rows = await db.likeness.findMany({ orderBy: [{ status: 'asc' }, { name: 'asc' }] });
    res.json({ items: rows.map(toLikenessDto) });
  })
);

adminRouter.post(
  '/admin/likenesses',
  multipart(likenessUpload),
  wrap(async (req, res) => {
    const raw = req.body as Record<string, unknown>;
    const body = LikenessBody.safeParse({ name: raw.name, aliases: parseAliases(raw.aliases), consentNote: raw.consentNote });
    if (!body.success) throw ApiError.validation(body.error.flatten());
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) throw new ApiError('UPLOAD_INVALID', 400, 'Attach at least one photo in the "photos" field.');
    for (const f of files) await sniffImage(f.buffer);

    const actor = actorOf(req);
    const likeness = await db.likeness.create({
      data: { name: body.data.name.trim(), aliases: body.data.aliases, consentNote: body.data.consentNote, approvedBy: actor.userId, photos: [] },
    });
    const photos: z.infer<typeof Photo>[] = [];
    for (const [i, f] of files.entries()) {
      const image = await toLibraryWebp(f.buffer);
      const up = await providers().upload(image, {
        folder: `${env().EA_CLOUDINARY_FOLDER}/likeness/${likeness.id}`,
        publicId: `photo-${i + 1}-${randomBytes(4).toString('hex')}`,
        format: 'webp',
        tags: ['likeness'],
      });
      photos.push({ url: up.url, publicId: up.publicId, width: up.width, height: up.height });
    }
    const saved = await db.likeness.update({ where: { id: likeness.id }, data: { photos } });
    await audit({
      action: 'likeness.create',
      targetType: 'likeness',
      targetId: likeness.id,
      actorUserId: actor.userId,
      callerKeyId: req.callerKeyId,
      metadata: { photos: photos.length },
    });
    res.status(201).json(toLikenessDto(saved));
  })
);

const PatchLikenessBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    aliases: z.array(z.string().trim().min(1).max(120)).max(10).optional(),
    consentNote: z.string().min(5).max(500).optional(),
    status: z.enum(['ACTIVE', 'RETIRED']).optional(),
  })
  .strict();

adminRouter.patch(
  '/admin/likenesses/:id',
  validateBody(PatchLikenessBody),
  wrap(async (req, res) => {
    const id = idParam(req);
    const body = req.body as z.infer<typeof PatchLikenessBody>;
    const existing = await db.likeness.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('No such likeness.');
    const retiring = body.status === 'RETIRED' && existing.status !== 'RETIRED';
    if (retiring) {
      // Step 4.10.4: a retired likeness's photos are deleted, not kept around.
      const photos = z.array(Photo).safeParse(existing.photos);
      for (const p of photos.success ? photos.data : []) await providers().destroy(p.publicId).catch(() => undefined);
    }
    const saved = await db.likeness.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.aliases !== undefined ? { aliases: body.aliases } : {}),
        ...(body.consentNote !== undefined ? { consentNote: body.consentNote } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(retiring ? { photos: [] } : {}),
      },
    });
    const actor = actorOf(req);
    await audit({ action: 'likeness.update', targetType: 'likeness', targetId: id, actorUserId: actor.userId, callerKeyId: req.callerKeyId, metadata: { fields: Object.keys(body) } });
    res.json(toLikenessDto(saved));
  })
);

// ---- spend ---------------------------------------------------------------------------------

adminRouter.get(
  '/admin/spend',
  wrap(async (_req, res) => {
    res.json(await spendSummary());
  })
);
