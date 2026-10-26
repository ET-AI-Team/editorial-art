/**
 * Generates exemplar candidates for one style or all of them, in-process (no queue).
 *
 *   bun run library:generate -- --style ink-wash
 *   bun run library:generate -- --all --limit 10
 *   bun run library:generate -- --style ink-wash --bootstrap     # use approved refs as references
 *
 * Subjects already generated for a style are skipped, so re-running only pays for what is
 * missing. Every call goes through the spend guard; the run stops at the first cap reached and
 * exits non-zero.
 */
import { db } from '../lib/db';
import { SpendCapError } from '../lib/spend-guard';
import { generateExemplar, NEUTRAL_SUBJECTS, type ExemplarOutcome } from '../library/exemplars';

const CONCURRENCY = 4;

interface Args {
  style: string | null;
  all: boolean;
  limit: number;
  bootstrap: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { style: null, all: false, limit: NEUTRAL_SUBJECTS.length, bootstrap: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--style') args.style = argv[++i] ?? null;
    else if (a === '--all') args.all = true;
    else if (a === '--bootstrap') args.bootstrap = true;
    else if (a === '--limit') args.limit = Math.max(1, Math.min(NEUTRAL_SUBJECTS.length, Number(argv[++i]) || NEUTRAL_SUBJECTS.length));
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (!args.all && !args.style) throw new Error('Pass --style <slug> or --all.');
  return args;
}

/** Runs tasks with a fixed number in flight; stops starting new ones once `stop` is set. */
async function pool<T>(items: T[], size: number, run: (item: T) => Promise<void>, stop: () => boolean): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length && !stop()) {
      const item = items[next++]!;
      await run(item);
    }
  });
  await Promise.all(workers);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const styles = await db.style.findMany({
    where: { ...(args.all ? { status: { not: 'RETIRED' } } : { slug: args.style! }) },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, slug: true },
  });
  if (styles.length === 0) throw new Error(args.all ? 'No styles found. Run seed:styles first.' : `No style with slug ${args.style}.`);

  const startedAt = new Date();
  const subjects = NEUTRAL_SUBJECTS.slice(0, args.limit);
  let capReached: SpendCapError | null = null;
  const counts = new Map<string, { created: number; passed: number; skipped: number; failed: number }>();

  const tasks = styles.flatMap((s) => subjects.map((subject) => ({ style: s, subject })));
  await pool(
    tasks,
    CONCURRENCY,
    async ({ style, subject }) => {
      const c = counts.get(style.slug) ?? { created: 0, passed: 0, skipped: 0, failed: 0 };
      counts.set(style.slug, c);
      try {
        const outcome: ExemplarOutcome = await generateExemplar(style.id, subject, args.bootstrap);
        if (outcome.status === 'skipped') c.skipped++;
        else {
          c.created++;
          if (outcome.passed) c.passed++;
        }
      } catch (error) {
        if (error instanceof SpendCapError) capReached = error;
        else console.error(`${style.slug} / ${subject}: ${error instanceof Error ? error.message : String(error)}`);
        c.failed++;
      }
    },
    () => capReached !== null
  );

  // A style with candidates is being curated, so it shows up in the review queue.
  await db.style.updateMany({ where: { id: { in: styles.map((s) => s.id) }, status: 'DRAFT' }, data: { status: 'CURATING' } });

  const cost = await db.attempt.aggregate({ _sum: { costInr: true }, where: { startedAt: { gte: startedAt } } });
  console.log('\nstyle                      created  passed  skipped  failed');
  for (const [slug, c] of counts) {
    console.log(`${slug.padEnd(26)} ${String(c.created).padStart(7)} ${String(c.passed).padStart(7)} ${String(c.skipped).padStart(8)} ${String(c.failed).padStart(7)}`);
  }
  console.log(`\nSpent Rs ${Number(cost._sum.costInr ?? 0).toFixed(2)} on this run.`);
  if (capReached) {
    console.error(`Stopped: ${(capReached as SpendCapError).message}`);
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
