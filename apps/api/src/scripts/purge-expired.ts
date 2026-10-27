/**
 * Retention (Step 4.10), run daily by editorial-art-purge.timer.
 *
 *   bun run purge:expired              apply
 *   bun run purge:expired -- --dry-run report only
 *
 * 1. Requests past expiresAt lose their article text and prompt (and the image prompts recorded
 *    on their options) and become EXPIRED. The hash, title, brief and images stay for history
 *    and reporting.
 * 2. Previews nobody finalized, older than EA_PREVIEW_RETENTION_DAYS, are deleted from Cloudinary
 *    (they are never published). Finals and packs are kept: they may be in use on the site.
 */
import { Prisma } from '@prisma/client';
import { db } from '../lib/db';
import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { providers } from '../providers';

const BATCH = 200;

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const now = new Date();

  const expiring = await db.request.findMany({ where: { expiresAt: { lt: now }, articleText: { not: null } }, select: { id: true } });
  if (!dryRun && expiring.length) {
    for (let i = 0; i < expiring.length; i += BATCH) {
      const ids = expiring.slice(i, i + BATCH).map((r) => r.id);
      await db.request.updateMany({ where: { id: { in: ids } }, data: { articleText: null, prompt: null } });
      // The recorded image prompts carry the editor's prompt, so they go too.
      await db.option.updateMany({ where: { requestId: { in: ids } }, data: { previewInput: Prisma.DbNull, finalInput: Prisma.DbNull } });
      // Only states that can move to EXPIRED; a request still working keeps its status until done.
      await db.request.updateMany({ where: { id: { in: ids }, status: { in: ['ACTIVE', 'HAS_FINAL', 'FAILED', 'CANCELLED'] } }, data: { status: 'EXPIRED' } });
    }
  }

  const cutoff = new Date(now.getTime() - env().EA_PREVIEW_RETENTION_DAYS * 86_400_000);
  const stale = await db.option.findMany({
    where: { picked: false, previewPublicId: { not: null }, createdAt: { lt: cutoff } },
    select: { id: true, previewPublicId: true },
  });
  let deleted = 0;
  let failed = 0;
  if (!dryRun) {
    for (const option of stale) {
      try {
        await providers().destroy(option.previewPublicId!);
        await db.option.update({ where: { id: option.id }, data: { previewUrl: null, previewPublicId: null } });
        deleted++;
      } catch (err) {
        failed++;
        logger.warn({ err, optionId: option.id }, 'purge_preview_failed');
      }
    }
  }

  console.log(`${dryRun ? 'Dry run: would expire' : 'Expired'} ${expiring.length} request(s).`);
  console.log(`${dryRun ? 'Dry run: would delete' : 'Deleted'} ${dryRun ? stale.length : deleted} old unpicked preview(s)${failed ? `, ${failed} failed` : ''}.`);
  if (failed) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
