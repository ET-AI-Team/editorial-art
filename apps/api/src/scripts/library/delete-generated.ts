/**
 * Deletes the retired AI-generated references for good: their rows and their Cloudinary images.
 *
 *   bun run library:delete-generated               # dry run (the default): counts only
 *   bun run library:delete-generated -- --apply    # deletes
 *
 * Only references with source GENERATED and status RETIRED are touched (library:import retires
 * them). Nothing else is ever deleted. Ask before running --apply against a shared database or
 * Cloudinary account.
 */
import { db } from '../../lib/db';
import { providers } from '../../providers';
import { parseFlags } from './common';

export interface DeleteResult {
  dryRun: boolean;
  found: number;
  destroyed: number;
  deleted: number;
  failed: number;
  styles: number;
}

export async function deleteGenerated(opts: { apply: boolean }): Promise<DeleteResult> {
  const rows = await db.styleReference.findMany({ where: { source: 'GENERATED', status: 'RETIRED' }, select: { id: true, publicId: true, styleId: true } });
  const result: DeleteResult = { dryRun: !opts.apply, found: rows.length, destroyed: 0, deleted: 0, failed: 0, styles: new Set(rows.map((r) => r.styleId)).size };
  if (!opts.apply || !rows.length) return result;

  const ids = new Set(rows.map((r) => r.id));
  for (const style of await db.style.findMany({ select: { id: true, coverReferenceIds: true } })) {
    const kept = style.coverReferenceIds.filter((id) => !ids.has(id));
    if (kept.length !== style.coverReferenceIds.length) await db.style.update({ where: { id: style.id }, data: { coverReferenceIds: kept } });
  }
  for (const row of rows) {
    try {
      await providers().destroy(row.publicId);
      result.destroyed++;
      await db.styleReference.delete({ where: { id: row.id } });
      result.deleted++;
    } catch (error) {
      result.failed++;
      console.error(`${row.publicId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return result;
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2), { apply: 'boolean', 'dry-run': 'boolean' });
  const apply = flags.apply === true && flags['dry-run'] !== true;
  const r = await deleteGenerated({ apply });
  if (r.dryRun) {
    console.log(`Dry run: ${r.found} retired generated references in ${r.styles} styles would be deleted, with their Cloudinary images. Pass --apply to delete.`);
    return;
  }
  console.log(`Deleted ${r.deleted} of ${r.found} retired generated references (${r.destroyed} Cloudinary images destroyed, ${r.failed} failed).`);
  if (r.failed) process.exitCode = 1;
}

if (import.meta.main) {
  main()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
