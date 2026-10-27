/**
 * Starts the style library afresh, so every style of the new library fills up again from
 * hand-picked artist references.
 *
 *   bun run library:fresh-start             # dry run: prints what would change
 *   bun run library:fresh-start -- --apply  # does it
 *
 * With --apply, in one transaction:
 *   - every APPROVED or CANDIDATE reference, of any source, is RETIRED (rows and Cloudinary
 *     images are kept, so nothing is lost and old requests still resolve their references);
 *   - every style's covers are cleared;
 *   - every style that is no longer in STYLE_LIBRARY.md (and not retired yet) is RETIRED;
 *   - every other style that is LIVE or CURATING goes back to DRAFT.
 *
 * Nothing is deleted, and requests, batches and options are never touched. Run seed:styles
 * first so the new styles exist. GET /styles caches its answer for 60 seconds inside the API
 * process, which a script cannot reach: the gallery shows the change within a minute (or at once
 * after an API restart).
 */
import { readFileSync } from 'node:fs';
import { parseStyleLibrary } from '@editorial-art/shared-types';
import { db } from '../../lib/db';
import { styleLibraryPath } from '../../library/styles';
import { parseFlags } from './common';

export interface FreshStartResult {
  dryRun: boolean;
  /** APPROVED or CANDIDATE references that are (or would be) retired. */
  references: number;
  /** Styles whose covers are (or would be) cleared. */
  covers: number;
  /** Styles in the library that go (or would go) from LIVE or CURATING to DRAFT. */
  toDraft: string[];
  /** Styles not in the library that are (or would be) retired. */
  retired: string[];
}

const NOTE = 'Retired by library:fresh-start.';

export async function freshStart(opts: { apply: boolean; markdown?: string }): Promise<FreshStartResult> {
  const library = new Set(parseStyleLibrary(opts.markdown ?? readFileSync(styleLibraryPath(), 'utf8')).styles.map((s) => s.slug));
  const styles = await db.style.findMany({ select: { id: true, slug: true, status: true, coverReferenceIds: true }, orderBy: { sortOrder: 'asc' } });
  const retire = styles.filter((s) => !library.has(s.slug) && s.status !== 'RETIRED');
  const draft = styles.filter((s) => library.has(s.slug) && (s.status === 'LIVE' || s.status === 'CURATING'));
  const withCovers = styles.filter((s) => s.coverReferenceIds.length > 0);
  const live = { status: { in: ['APPROVED' as const, 'CANDIDATE' as const] } };
  const result: FreshStartResult = {
    dryRun: !opts.apply,
    references: await db.styleReference.count({ where: live }),
    covers: withCovers.length,
    toDraft: draft.map((s) => s.slug),
    retired: retire.map((s) => s.slug),
  };
  if (!opts.apply) return result;

  await db.$transaction(
    async (tx) => {
      // Keep any note a reviewer left; add one where there is none.
      await tx.styleReference.updateMany({ where: { ...live, reviewNote: null }, data: { status: 'RETIRED', reviewNote: NOTE } });
      await tx.styleReference.updateMany({ where: live, data: { status: 'RETIRED' } });
      if (withCovers.length) await tx.style.updateMany({ where: { id: { in: withCovers.map((s) => s.id) } }, data: { coverReferenceIds: [] } });
      if (retire.length) await tx.style.updateMany({ where: { id: { in: retire.map((s) => s.id) } }, data: { status: 'RETIRED', retiredAt: new Date() } });
      if (draft.length) await tx.style.updateMany({ where: { id: { in: draft.map((s) => s.id) } }, data: { status: 'DRAFT' } });
    },
    { timeout: 60_000 }
  );
  return result;
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2), { apply: 'boolean' });
  const r = await freshStart({ apply: flags.apply === true });
  const verb = r.dryRun ? 'Would' : 'Did';
  console.log(`${r.dryRun ? 'DRY RUN (pass --apply to do it).' : 'Applied.'}`);
  console.log(`${verb} retire ${r.references} approved or candidate references (rows and images kept).`);
  console.log(`${verb} clear the covers of ${r.covers} styles.`);
  console.log(`${verb} move ${r.toDraft.length} LIVE or CURATING styles to DRAFT${r.toDraft.length ? `: ${r.toDraft.join(', ')}` : ''}.`);
  console.log(`${verb} retire ${r.retired.length} styles that are not in STYLE_LIBRARY.md${r.retired.length ? `: ${r.retired.join(', ')}` : ''}.`);
  console.log('Requests, batches and options are not touched. Nothing is deleted.');
  if (!r.dryRun) console.log('The gallery cache expires within 60 seconds (or restart the API to see it at once).');
}

if (import.meta.main) {
  main()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
