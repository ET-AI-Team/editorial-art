import { Prisma } from '@prisma/client';
import { ADMIN_STATS_DEFAULT_DAYS, ADMIN_STATS_MAX_DAYS, AdminStatsResponse, type AdminStatsQuery } from '@editorial-art/shared-types';
import { NO_TEXT_AGAIN } from '../pipeline/preview';
import { db } from '../lib/db';
import { ApiError } from '../lib/errors';

/**
 * GET /admin/stats: usage, speed, cost and quality over a time range. Read only, and every number
 * comes from a grouped query in Postgres, so a year-long range costs the same handful of queries
 * as a day.
 *
 * What is counted, and when it falls in the range [from, to):
 * - requests, batches: by their createdAt.
 * - options (previews, finals, picks, judge scores, models, text retries): by the option's
 *   createdAt, so an option made in the range counts even if it was finalized after `to`.
 *   previews = options that got a preview image; previewsFailed = PREVIEW_FAILED or BLOCKED;
 *   finals = options that got a final image; finalsFailed = FINAL_FAILED.
 * - cost and calls: Attempt rows by startedAt; costInr is the sum of Attempt.costInr. Cost per user
 *   goes through Attempt.requestId and cost per style through Attempt.optionId, so library work
 *   (exemplars, screening) and request-level calls (read, embed) are in the totals but not in a
 *   style's cost, and library work is in no user's cost.
 * - daily: Asia/Kolkata calendar days; finals by the option's createdAt, cost by startedAt.
 *
 * Speed and quality:
 * - avgFirstPreviewSec: for each batch made in the range, Batch.createdAt to its first preview
 *   ready. An option's preview is ready when its last preview or preview_check call completed
 *   (no column records the moment itself; the upload after it takes about a second).
 * - avgFinalSec: Option.pickedAt (the finalize request; a retry after a failure resets it) to the
 *   last finalize or judge call of that option, for options that have a final.
 * - p50Ms / p90Ms: latency of successful calls only (a timeout would say more about the timeout
 *   than the model); null when a model had no successful call.
 * - textRetryRate: options whose last preview prompt carried the no-text instruction (the second
 *   pass after the preview check found writing), over options that sent a preview prompt. A
 *   BullMQ retry of the whole preview overwrites that prompt, so this slightly undercounts.
 * - refusalRate: REFUSED preview calls over all preview calls.
 * - judged and avg scores: options with a stored judge verdict (Option.judge, written on both a
 *   passing and a failed final).
 * Averages and rates are null when there is nothing to divide by.
 */

const DAY_MS = 86_400_000;
/** Asia/Kolkata is UTC+05:30 all year (no daylight saving). */
const IST_OFFSET_MS = 330 * 60_000;
const TZ = 'Asia/Kolkata';

export interface StatsRange {
  from: Date;
  to: Date;
}

/** Defaults to the last 30 days; `to` must be after `from` and the range at most 366 days. */
export function statsRange(q: AdminStatsQuery, now = new Date()): StatsRange {
  const to = q.to ? new Date(q.to) : now;
  const from = q.from ? new Date(q.from) : new Date(to.getTime() - ADMIN_STATS_DEFAULT_DAYS * DAY_MS);
  if (to.getTime() <= from.getTime()) throw ApiError.validation({ fieldErrors: { to: ['must be after from'] } }, '`to` must be after `from`.');
  if (to.getTime() - from.getTime() > ADMIN_STATS_MAX_DAYS * DAY_MS) {
    throw ApiError.validation({ fieldErrors: { to: [`the range may be at most ${ADMIN_STATS_MAX_DAYS} days`] } }, `The range may be at most ${ADMIN_STATS_MAX_DAYS} days.`);
  }
  return { from, to };
}

/** The Asia/Kolkata calendar day of an instant, as YYYY-MM-DD. */
export function istDay(at: Date): string {
  return new Date(at.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Every Asia/Kolkata day the range touches, oldest first. */
function istDays(range: StatsRange): string[] {
  const days: string[] = [];
  const last = istDay(new Date(range.to.getTime() - 1));
  for (let d = istDay(range.from); ; d = new Date(Date.parse(`${d}T00:00:00Z`) + DAY_MS).toISOString().slice(0, 10)) {
    days.push(d);
    if (d >= last) return days;
  }
}

const round = (n: number, places: number) => Math.round(n * 10 ** places) / 10 ** places;
const inr = (n: number | string | Prisma.Decimal | null | undefined) => round(Number(n ?? 0), 4);
const orNull = (n: number | null | undefined, places: number) => (n === null || n === undefined ? null : round(Number(n), places));
const ratio = (num: number, den: number) => (den > 0 ? round(num / den, 4) : null);

type DayCount = { day: string; n: number };
type DayCost = { day: string; cost: number };
type KeyCount = { key: string; n: number };
type KeyCost = { key: string; cost: number };

export async function adminStats(range: StatsRange): Promise<AdminStatsResponse> {
  const from = Prisma.sql`${range.from.toISOString()}::timestamptz`;
  const to = Prisma.sql`${range.to.toISOString()}::timestamptz`;
  const inRange = (col: Prisma.Sql) => Prisma.sql`${col} >= ${from} AND ${col} < ${to}`;
  const day = (col: Prisma.Sql) => Prisma.sql`to_char(date_trunc('day', ${col} AT TIME ZONE ${TZ}), 'YYYY-MM-DD')`;

  const attemptsWhere = { startedAt: { gte: range.from, lt: range.to } };

  const [
    requestsDaily,
    batchesDaily,
    finalsDaily,
    costDaily,
    optionTotals,
    firstPreview,
    toFinal,
    byStage,
    byModel,
    previewAttempts,
    usersRequests,
    usersBatches,
    usersFinals,
    usersCost,
    styleRows,
    styleCounts,
    styleCost,
    previewModels,
    finalModels,
  ] = await Promise.all([
    db.$queryRaw<DayCount[]>`SELECT ${day(Prisma.sql`"createdAt"`)} AS day, count(*)::int AS n FROM "Request" WHERE ${inRange(Prisma.sql`"createdAt"`)} GROUP BY 1`,
    db.$queryRaw<DayCount[]>`SELECT ${day(Prisma.sql`"createdAt"`)} AS day, count(*)::int AS n FROM "Batch" WHERE ${inRange(Prisma.sql`"createdAt"`)} GROUP BY 1`,
    db.$queryRaw<DayCount[]>`SELECT ${day(Prisma.sql`"createdAt"`)} AS day, count(*)::int AS n FROM "Option" WHERE ${inRange(Prisma.sql`"createdAt"`)} AND "finalUrl" IS NOT NULL GROUP BY 1`,
    db.$queryRaw<DayCost[]>`SELECT ${day(Prisma.sql`"startedAt"`)} AS day, sum("costInr")::float8 AS cost FROM "Attempt" WHERE ${inRange(Prisma.sql`"startedAt"`)} GROUP BY 1`,
    db.$queryRaw<
      {
        previews: number;
        previewsFailed: number;
        finals: number;
        finalsFailed: number;
        judged: number;
        avgOnStyle: number | null;
        avgAppeal: number | null;
        avgComposition: number | null;
        previewTried: number;
        textRetried: number;
      }[]
    >`
      SELECT
        count(*) FILTER (WHERE "previewUrl" IS NOT NULL)::int AS "previews",
        count(*) FILTER (WHERE "state" IN ('PREVIEW_FAILED', 'BLOCKED'))::int AS "previewsFailed",
        count(*) FILTER (WHERE "finalUrl" IS NOT NULL)::int AS "finals",
        count(*) FILTER (WHERE "state" = 'FINAL_FAILED')::int AS "finalsFailed",
        count(*) FILTER (WHERE "judge" IS NOT NULL)::int AS "judged",
        avg(("judge"->>'onStyle')::float8) AS "avgOnStyle",
        avg(("judge"->>'appeal')::float8) AS "avgAppeal",
        avg(("judge"->>'composition')::float8) AS "avgComposition",
        count(*) FILTER (WHERE "previewInput" IS NOT NULL)::int AS "previewTried",
        count(*) FILTER (WHERE strpos("previewInput"->>'prompt', ${NO_TEXT_AGAIN}) > 0)::int AS "textRetried"
      FROM "Option" WHERE ${inRange(Prisma.sql`"createdAt"`)}`,
    // Batch made -> its first option's preview ready (that option's last preview/preview_check call).
    db.$queryRaw<{ sec: number | null }[]>`
      WITH ready AS (
        SELECT o."batchId", max(a."completedAt") AS at
        FROM "Option" o
        JOIN "Attempt" a ON a."requestId" = o."requestId" AND a."optionId" = o."id" AND a."stage" IN ('preview', 'preview_check')
        WHERE o."previewUrl" IS NOT NULL AND o."batchId" IN (SELECT "id" FROM "Batch" WHERE ${inRange(Prisma.sql`"createdAt"`)})
        GROUP BY o."id", o."batchId"
      )
      SELECT avg(extract(epoch FROM f.at - b."createdAt"))::float8 AS sec
      FROM (SELECT "batchId", min(at) AS at FROM ready GROUP BY "batchId") f
      JOIN "Batch" b ON b."id" = f."batchId"`,
    // Finalize requested (pickedAt) -> the option's last finalize/judge call.
    db.$queryRaw<{ sec: number | null }[]>`
      SELECT avg(extract(epoch FROM r.at - r."pickedAt"))::float8 AS sec FROM (
        SELECT o."pickedAt", max(a."completedAt") AS at
        FROM "Option" o
        JOIN "Attempt" a ON a."requestId" = o."requestId" AND a."optionId" = o."id" AND a."stage" IN ('finalize', 'judge') AND a."startedAt" >= o."pickedAt"
        WHERE ${inRange(Prisma.sql`o."createdAt"`)} AND o."finalUrl" IS NOT NULL AND o."pickedAt" IS NOT NULL
        GROUP BY o."id", o."pickedAt"
      ) r`,
    db.attempt.groupBy({ by: ['stage'], where: attemptsWhere, _count: { _all: true }, _sum: { costInr: true } }),
    db.$queryRaw<{ model: string; provider: string; calls: number; cost: number; p50: number | null; p90: number | null }[]>`
      SELECT "model", "provider", count(*)::int AS calls, sum("costInr")::float8 AS cost,
        (percentile_cont(0.5) WITHIN GROUP (ORDER BY "latencyMs") FILTER (WHERE "result" = 'OK'))::float8 AS p50,
        (percentile_cont(0.9) WITHIN GROUP (ORDER BY "latencyMs") FILTER (WHERE "result" = 'OK'))::float8 AS p90
      FROM "Attempt" WHERE ${inRange(Prisma.sql`"startedAt"`)}
      GROUP BY "model", "provider"`,
    db.attempt.groupBy({ by: ['result'], where: { ...attemptsWhere, stage: 'preview' }, _count: { _all: true } }),
    db.request.groupBy({ by: ['actorUserId'], where: { createdAt: { gte: range.from, lt: range.to } }, _count: { _all: true } }),
    db.$queryRaw<KeyCount[]>`
      SELECT r."actorUserId" AS key, count(*)::int AS n FROM "Batch" b JOIN "Request" r ON r."id" = b."requestId"
      WHERE ${inRange(Prisma.sql`b."createdAt"`)} GROUP BY 1`,
    db.$queryRaw<KeyCount[]>`
      SELECT r."actorUserId" AS key, count(*)::int AS n FROM "Option" o JOIN "Request" r ON r."id" = o."requestId"
      WHERE ${inRange(Prisma.sql`o."createdAt"`)} AND o."finalUrl" IS NOT NULL GROUP BY 1`,
    db.$queryRaw<KeyCost[]>`
      SELECT r."actorUserId" AS key, sum(a."costInr")::float8 AS cost FROM "Attempt" a JOIN "Request" r ON r."id" = a."requestId"
      WHERE ${inRange(Prisma.sql`a."startedAt"`)} GROUP BY 1`,
    db.style.findMany({
      where: { status: { not: 'RETIRED' } },
      select: { id: true, slug: true, label: true, status: true, family: { select: { slug: true, label: true } } },
      orderBy: [{ family: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    }),
    db.$queryRaw<{ key: string; batches: number; picks: number; finals: number }[]>`
      SELECT "styleId" AS key, count(DISTINCT "batchId")::int AS batches,
        count(*) FILTER (WHERE "picked")::int AS picks,
        count(*) FILTER (WHERE "finalUrl" IS NOT NULL)::int AS finals
      FROM "Option" WHERE ${inRange(Prisma.sql`"createdAt"`)} GROUP BY 1`,
    db.$queryRaw<KeyCost[]>`
      SELECT o."styleId" AS key, sum(a."costInr")::float8 AS cost FROM "Attempt" a JOIN "Option" o ON o."id" = a."optionId"
      WHERE ${inRange(Prisma.sql`a."startedAt"`)} GROUP BY 1`,
    db.option.groupBy({ by: ['previewModel'], where: { createdAt: { gte: range.from, lt: range.to }, previewModel: { not: null } }, _count: { _all: true } }),
    db.option.groupBy({ by: ['finalModel'], where: { createdAt: { gte: range.from, lt: range.to }, finalModel: { not: null } }, _count: { _all: true } }),
  ]);

  const counts = (rows: { key: string; n: number }[]) => new Map(rows.map((r) => [r.key, r.n]));
  const costs = (rows: { key: string; cost: number }[]) => new Map(rows.map((r) => [r.key, r.cost]));
  const byDay = (rows: DayCount[]) => new Map(rows.map((r) => [r.day, r.n]));

  const reqDay = byDay(requestsDaily);
  const batchDay = byDay(batchesDaily);
  const finalDay = byDay(finalsDaily);
  const costDay = new Map(costDaily.map((r) => [r.day, r.cost]));
  const daily = istDays(range).map((date) => ({
    date,
    requests: reqDay.get(date) ?? 0,
    batches: batchDay.get(date) ?? 0,
    finals: finalDay.get(date) ?? 0,
    costInr: inr(costDay.get(date)),
  }));

  const o = optionTotals[0]!;
  const previewCalls = previewAttempts.reduce((s, r) => s + r._count._all, 0);
  const previewRefused = previewAttempts.find((r) => r.result === 'REFUSED')?._count._all ?? 0;

  const reqByUser = new Map(usersRequests.map((r) => [r.actorUserId, r._count._all]));
  const batchByUser = counts(usersBatches);
  const finalByUser = counts(usersFinals);
  const costByUser = costs(usersCost);
  const users = new Set([...reqByUser.keys(), ...batchByUser.keys(), ...finalByUser.keys(), ...costByUser.keys()]);
  const byUser = [...users]
    .map((actorUserId) => ({
      actorUserId,
      requests: reqByUser.get(actorUserId) ?? 0,
      batches: batchByUser.get(actorUserId) ?? 0,
      finals: finalByUser.get(actorUserId) ?? 0,
      costInr: inr(costByUser.get(actorUserId)),
    }))
    .sort((a, b) => b.costInr - a.costInr || b.requests - a.requests || a.actorUserId.localeCompare(b.actorUserId));

  const perStyle = new Map(styleCounts.map((r) => [r.key, r]));
  const costByStyle = costs(styleCost);
  const styles = styleRows.map((s) => ({
    styleId: s.id,
    slug: s.slug,
    label: s.label,
    familySlug: s.family.slug,
    familyLabel: s.family.label,
    status: s.status,
    batches: perStyle.get(s.id)?.batches ?? 0,
    picks: perStyle.get(s.id)?.picks ?? 0,
    finals: perStyle.get(s.id)?.finals ?? 0,
    costInr: inr(costByStyle.get(s.id)),
  }));

  const shares = (rows: { model: string | null; count: number }[]) => {
    const total = rows.reduce((s, r) => s + r.count, 0);
    return rows
      .map((r) => ({ model: r.model!, count: r.count, share: round(r.count / total, 4) }))
      .sort((a, b) => b.count - a.count || a.model.localeCompare(b.model));
  };

  return AdminStatsResponse.parse({
    range: { from: range.from.toISOString(), to: range.to.toISOString() },
    totals: {
      requests: daily.reduce((s, d) => s + d.requests, 0),
      batches: daily.reduce((s, d) => s + d.batches, 0),
      previews: o.previews,
      previewsFailed: o.previewsFailed,
      finals: o.finals,
      finalsFailed: o.finalsFailed,
      costInr: inr(costDaily.reduce((s, d) => s + d.cost, 0)),
      avgFirstPreviewSec: orNull(firstPreview[0]?.sec, 1),
      avgFinalSec: orNull(toFinal[0]?.sec, 1),
    },
    daily,
    costByStage: byStage
      .map((r) => ({ stage: r.stage, calls: r._count._all, costInr: inr(r._sum.costInr) }))
      .sort((a, b) => b.costInr - a.costInr || a.stage.localeCompare(b.stage)),
    costByModel: byModel
      .map((r) => ({ model: r.model, provider: r.provider, calls: r.calls, costInr: inr(r.cost), p50Ms: orNull(r.p50, 0), p90Ms: orNull(r.p90, 0) }))
      .sort((a, b) => b.costInr - a.costInr || a.model.localeCompare(b.model)),
    byUser,
    styles,
    quality: {
      judged: o.judged,
      avgOnStyle: orNull(o.avgOnStyle, 2),
      avgAppeal: orNull(o.avgAppeal, 2),
      avgComposition: orNull(o.avgComposition, 2),
      textRetryRate: ratio(o.textRetried, o.previewTried),
      refusalRate: ratio(previewRefused, previewCalls),
    },
    models: {
      preview: shares(previewModels.map((r) => ({ model: r.previewModel, count: r._count._all }))),
      final: shares(finalModels.map((r) => ({ model: r.finalModel, count: r._count._all }))),
    },
  });
}
