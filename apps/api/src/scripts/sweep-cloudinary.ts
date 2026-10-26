/**
 * The weekly Cloudinary sweep (Step 8.7), run by editorial-art-sweep.timer.
 *
 *   bun run sweep:cloudinary              dry run: report only (the default)
 *   bun run sweep:cloudinary -- --apply   delete
 *
 * Deletes only assets under EA_CLOUDINARY_FOLDER that are more than 7 days old AND referenced by
 * nothing in the database: no option preview or final, no publish pack asset, no style reference
 * and no likeness photo. Those are orphans from crashes between an upload and the row update.
 */
import { v2 as cloudinary } from 'cloudinary';
import type { PackAsset } from '@editorial-art/shared-types';
import { db } from '../lib/db';
import { env } from '../lib/env';
import { logger } from '../lib/logger';

const MIN_AGE_MS = 7 * 86_400_000;

/** `.../image/upload/<transform>/v123/<public id>.<ext>` to `<public id>`. */
export function publicIdFromUrl(url: string): string | null {
  const m = /\/image\/upload\/(?:[^/]*,[^/]*\/|[a-z]+_[^/]+\/)*(?:v\d+\/)?(.+)\.[a-z0-9]+$/i.exec(url);
  return m?.[1] ?? null;
}

async function referencedIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  const add = (id: string | null | undefined) => {
    if (id) ids.add(id);
  };
  for (const o of await db.option.findMany({ select: { previewPublicId: true, finalPublicId: true } })) {
    add(o.previewPublicId);
    add(o.finalPublicId);
  }
  for (const p of await db.publishPack.findMany({ select: { assets: true } })) {
    for (const a of (p.assets as unknown as PackAsset[]) ?? []) {
      add(publicIdFromUrl(a.webpUrl));
      add(publicIdFromUrl(a.jpgUrl));
    }
  }
  for (const r of await db.styleReference.findMany({ select: { publicId: true } })) add(r.publicId);
  for (const l of await db.likeness.findMany({ select: { photos: true } })) {
    for (const photo of (l.photos as { publicId?: string; url?: string }[]) ?? []) add(photo.publicId ?? (photo.url ? publicIdFromUrl(photo.url) : null));
  }
  return ids;
}

interface CloudinaryResource {
  public_id: string;
  created_at: string;
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const config = env();
  cloudinary.config({ cloud_name: config.CLOUDINARY_CLOUD_NAME, api_key: config.CLOUDINARY_API_KEY, api_secret: config.CLOUDINARY_API_SECRET, secure: true });

  const keep = await referencedIds();
  const cutoff = Date.now() - MIN_AGE_MS;
  const orphans: string[] = [];
  let scanned = 0;
  let cursor: string | undefined;
  do {
    const page = (await cloudinary.api.resources({ type: 'upload', prefix: config.EA_CLOUDINARY_FOLDER, max_results: 500, ...(cursor ? { next_cursor: cursor } : {}) })) as {
      resources: CloudinaryResource[];
      next_cursor?: string;
    };
    for (const r of page.resources) {
      scanned++;
      if (!keep.has(r.public_id) && new Date(r.created_at).getTime() < cutoff) orphans.push(r.public_id);
    }
    cursor = page.next_cursor;
  } while (cursor);

  let deleted = 0;
  if (apply) {
    // The admin API deletes up to 100 public ids per call.
    for (let i = 0; i < orphans.length; i += 100) {
      const chunk = orphans.slice(i, i + 100);
      try {
        await cloudinary.api.delete_resources(chunk, { type: 'upload', resource_type: 'image' });
        deleted += chunk.length;
      } catch (err) {
        logger.warn({ err, count: chunk.length }, 'sweep_delete_failed');
        process.exitCode = 1;
      }
    }
  }
  console.log(`Scanned ${scanned} asset(s) under ${config.EA_CLOUDINARY_FOLDER}/; ${orphans.length} orphan(s) older than 7 days.`);
  console.log(apply ? `Deleted ${deleted}.` : 'Dry run: nothing deleted. Pass --apply to delete.');
}

if (import.meta.main) {
  main()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
