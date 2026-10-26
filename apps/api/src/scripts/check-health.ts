/**
 * Alerts (Step 8.5), run every 5 minutes by editorial-art-health.timer.
 *
 *   bun run check:health
 *
 * Trips on: /ready failing twice in a row; preview failures over 25% in the last 30 minutes
 * (with at least 8 attempts); spend today over 80% of the daily cap; any request reading for
 * more than 10 minutes. Each trip is an error-level `health_alert` log line, and the run exits 1
 * so the unit shows as failed until the next clean run.
 */
import { db } from '../lib/db';
import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { utcDay } from '../lib/spend-guard';

const MINUTE = 60_000;

async function readyOnce(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const config = env();
  const alerts: { check: string; detail: Record<string, unknown> }[] = [];

  const readyUrl = `http://${config.EA_HOST}:${config.EA_PORT}/ready`;
  if (!(await readyOnce(readyUrl))) {
    await new Promise((r) => setTimeout(r, 5_000));
    if (!(await readyOnce(readyUrl))) alerts.push({ check: 'ready', detail: { url: readyUrl } });
  }

  const since = new Date(Date.now() - 30 * MINUTE);
  const previews = await db.attempt.groupBy({ by: ['result'], where: { stage: 'preview', startedAt: { gte: since } }, _count: true });
  const total = previews.reduce((n, p) => n + p._count, 0);
  const failed = previews.filter((p) => p.result !== 'OK').reduce((n, p) => n + p._count, 0);
  if (total >= 8 && failed / total > 0.25) alerts.push({ check: 'preview_failure_rate', detail: { failed, total, windowMinutes: 30 } });

  const today = await db.spendLedger.findUnique({ where: { day: utcDay() } });
  const spent = Number(today?.costInr ?? 0);
  if (config.EA_DAILY_SPEND_CAP_INR !== undefined && spent > 0.8 * config.EA_DAILY_SPEND_CAP_INR) alerts.push({ check: 'daily_spend', detail: { todayInr: spent, capInr: config.EA_DAILY_SPEND_CAP_INR } });

  const stuck = await db.request.count({ where: { status: 'READING', updatedAt: { lt: new Date(Date.now() - 10 * MINUTE) } } });
  if (stuck > 0) alerts.push({ check: 'stuck_reading', detail: { requests: stuck } });

  for (const alert of alerts) logger.error({ check: alert.check, ...alert.detail }, 'health_alert');
  if (alerts.length) {
    console.error(`${alerts.length} check(s) tripped: ${alerts.map((a) => a.check).join(', ')}.`);
    process.exitCode = 1;
  } else {
    console.log('All health checks passed.');
  }
}

main()
  .catch((error) => {
    logger.error({ err: error }, 'health_check_crashed');
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
