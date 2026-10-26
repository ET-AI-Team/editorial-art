/**
 * The weekly report (Step 8.6): volume, speed, picks, quality and cost.
 *
 *   bun run report:weekly                                   last 7 days
 *   bun run report:weekly -- --from 2026-11-02 --to 2026-11-09
 *
 * Times come from row timestamps: first preview is the earliest preview Attempt that succeeded
 * after the request was created; final is when its picked option reached a final.
 */
import { db } from '../lib/db';

interface Range {
  from: Date;
  to: Date;
}

function parseArgs(argv: string[]): Range {
  const to = new Date();
  const range: Range = { from: new Date(to.getTime() - 7 * 86_400_000), to };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = argv[++i];
    const date = value ? new Date(value) : new Date(NaN);
    if (Number.isNaN(date.getTime())) throw new Error(`${a} needs an ISO date`);
    if (a === '--from') range.from = date;
    else if (a === '--to') range.to = date;
    else throw new Error(`Unknown argument: ${a}`);
  }
  return range;
}

function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]!;
}

const fmt = (n: number | null, unit = '') => (n === null ? 'n/a' : `${Math.round(n * 10) / 10}${unit}`);
const inr = (n: number) => `Rs ${n.toFixed(2)}`;

async function main(): Promise<void> {
  const range = parseArgs(process.argv.slice(2));
  const window = { gte: range.from, lt: range.to };

  const requests = await db.request.findMany({
    where: { createdAt: window },
    select: { id: true, createdAt: true, costInr: true, status: true, actorWorkspaceId: true, briefs: { select: { desk: true }, take: 1, orderBy: { version: 'desc' } } },
  });
  const ids = requests.map((r) => r.id);
  const [batches, options, attempts, styles] = await Promise.all([
    db.batch.count({ where: { requestId: { in: ids } } }),
    db.option.findMany({ where: { requestId: { in: ids } }, select: { requestId: true, styleId: true, picked: true, pickedAt: true, finalUrl: true, state: true, updatedAt: true } }),
    db.attempt.findMany({ where: { startedAt: window }, select: { requestId: true, stage: true, model: true, result: true, costInr: true, completedAt: true } }),
    db.style.findMany({ select: { id: true, label: true } }),
  ]);
  const styleLabel = new Map(styles.map((s) => [s.id, s.label]));

  // Speed.
  const firstPreview: number[] = [];
  const toFinal: number[] = [];
  for (const r of requests) {
    const done = attempts.filter((a) => a.requestId === r.id && a.stage === 'preview' && a.result === 'OK').map((a) => a.completedAt.getTime());
    if (done.length) firstPreview.push((Math.min(...done) - r.createdAt.getTime()) / 1000);
    const picked = options.filter((o) => o.requestId === r.id && o.picked && o.finalUrl && o.pickedAt);
    for (const o of picked) toFinal.push((o.updatedAt.getTime() - o.pickedAt!.getTime()) / 1000);
  }

  // Picks per style.
  const perStyle = new Map<string, { shown: number; picked: number }>();
  for (const o of options) {
    const s = perStyle.get(o.styleId) ?? { shown: 0, picked: 0 };
    s.shown++;
    if (o.picked) s.picked++;
    perStyle.set(o.styleId, s);
  }

  // Quality.
  const refusals = new Map<string, number>();
  for (const a of attempts.filter((x) => x.result === 'REFUSED')) refusals.set(a.model, (refusals.get(a.model) ?? 0) + 1);
  const blocked = options.filter((o) => o.state === 'BLOCKED').length;
  const finalFailed = options.filter((o) => o.state === 'FINAL_FAILED').length;

  // Cost.
  const costByStage = new Map<string, number>();
  for (const a of attempts) costByStage.set(a.stage, (costByStage.get(a.stage) ?? 0) + Number(a.costInr));
  const totalCost = [...costByStage.values()].reduce((s, n) => s + n, 0);
  const perRequest = requests.map((r) => Number(r.costInr));

  const desks = new Map<string, number>();
  for (const r of requests) {
    const desk = r.briefs[0]?.desk ?? 'unread';
    desks.set(desk, (desks.get(desk) ?? 0) + 1);
  }

  const lines = [
    `ET Articles weekly report: ${range.from.toISOString().slice(0, 10)} to ${range.to.toISOString().slice(0, 10)}`,
    '',
    'VOLUME',
    `  Requests: ${requests.length}   Batches: ${batches}   Finals: ${options.filter((o) => o.finalUrl).length}`,
    `  By desk: ${[...desks].map(([d, n]) => `${d} ${n}`).join(', ') || 'none'}`,
    '',
    'SPEED',
    `  First preview p50 ${fmt(percentile(firstPreview, 50), ' s')}, p90 ${fmt(percentile(firstPreview, 90), ' s')}`,
    `  Final and pack p50 ${fmt(percentile(toFinal, 50), ' s')}, p90 ${fmt(percentile(toFinal, 90), ' s')}`,
    '',
    'PICKS BY STYLE (picked / shown)',
    ...[...perStyle]
      .sort((a, b) => b[1].picked - a[1].picked || b[1].shown - a[1].shown)
      .map(([id, s]) => `  ${(styleLabel.get(id) ?? id).padEnd(24)} ${s.picked} / ${s.shown}`),
    '',
    'QUALITY',
    `  Blocked options: ${blocked}   Finals that failed their checks: ${finalFailed}`,
    `  Refusals by model: ${[...refusals].map(([m, n]) => `${m} ${n}`).join(', ') || 'none'}`,
    '',
    'COST',
    `  Total ${inr(totalCost)}   Per request p50 ${perRequest.length ? inr(percentile(perRequest, 50)!) : 'n/a'}, p90 ${perRequest.length ? inr(percentile(perRequest, 90)!) : 'n/a'}`,
    ...[...costByStage].sort((a, b) => b[1] - a[1]).map(([stage, cost]) => `  ${stage.padEnd(14)} ${inr(cost)}`),
  ];
  console.log(lines.join('\n'));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
