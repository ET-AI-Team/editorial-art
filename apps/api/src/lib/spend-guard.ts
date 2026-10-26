import { Prisma } from '@prisma/client';
import { db } from './db';
import { env } from './env';
import { logger } from './logger';
import { StageError } from './errors';

/**
 * Three caps, all checked before a paid call with that call's estimate:
 * per request, per UTC day, and the build period (only while EA_BUILD_SPEND_CAP_INR is set).
 * The real cost is recorded afterwards from token usage, in one transaction with the Attempt,
 * so concurrent calls can overshoot a cap by at most one call each.
 */

export const BUILD_LEDGER_DAY = new Date('1970-01-01T00:00:00.000Z');

export type SpendScope = 'request' | 'day' | 'build';

export class SpendCapError extends StageError {
  constructor(readonly scope: SpendScope) {
    super('SPEND_CAP_REACHED', spendMessage(scope), false);
  }
}

function spendMessage(scope: SpendScope): string {
  if (scope === 'request') return 'This article has reached its spending limit. Start a new request to keep going.';
  if (scope === 'day') return "Today's budget for ET Articles is used up. It resets at 5:30 AM IST.";
  return 'The build budget for ET Articles is used up.';
}

export function utcDay(at = new Date()): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

async function ledgerTotal(day: Date): Promise<number> {
  const row = await db.spendLedger.findUnique({ where: { day } });
  return row ? Number(row.costInr) : 0;
}

/** Throws SpendCapError when `estimateInr` more would pass any cap. */
export async function assertCanSpend(estimateInr: number, requestId?: string | null): Promise<void> {
  const config = env();
  if (requestId) {
    const request = await db.request.findUnique({ where: { id: requestId }, select: { costInr: true, spendCapInr: true } });
    if (request && Number(request.costInr) + estimateInr > Number(request.spendCapInr)) throw new SpendCapError('request');
  }
  const today = await ledgerTotal(utcDay());
  if (today + estimateInr > config.EA_DAILY_SPEND_CAP_INR) throw new SpendCapError('day');
  if (config.EA_BUILD_SPEND_CAP_INR !== undefined) {
    const build = await ledgerTotal(BUILD_LEDGER_DAY);
    if (build + estimateInr > config.EA_BUILD_SPEND_CAP_INR) throw new SpendCapError('build');
  }
}

export interface AttemptRecord {
  requestId?: string | null;
  optionId?: string | null;
  stage: string;
  provider: 'openai' | 'google' | 'fake';
  model: string;
  result: 'OK' | 'REFUSED' | 'ERROR' | 'TIMEOUT';
  errorCode?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  imageTokens?: number;
  costInr: number;
  startedAt: Date;
  completedAt: Date;
}

/** Writes the Attempt and adds its cost to the request, today's ledger and the build ledger. */
export async function recordAttempt(a: AttemptRecord): Promise<void> {
  const cost = new Prisma.Decimal(a.costInr.toFixed(4));
  const ops: Prisma.PrismaPromise<unknown>[] = [
    db.attempt.create({
      data: {
        requestId: a.requestId ?? null,
        optionId: a.optionId ?? null,
        stage: a.stage,
        provider: a.provider,
        model: a.model,
        result: a.result,
        errorCode: a.errorCode ?? null,
        inputTokens: a.inputTokens ?? 0,
        outputTokens: a.outputTokens ?? 0,
        imageTokens: a.imageTokens ?? 0,
        costInr: cost,
        latencyMs: Math.max(0, a.completedAt.getTime() - a.startedAt.getTime()),
        startedAt: a.startedAt,
        completedAt: a.completedAt,
      },
    }),
  ];
  if (a.costInr > 0) {
    if (a.requestId) {
      ops.push(db.request.update({ where: { id: a.requestId }, data: { costInr: { increment: cost } } }));
    }
    ops.push(
      db.spendLedger.upsert({
        where: { day: utcDay(a.completedAt) },
        create: { day: utcDay(a.completedAt), costInr: cost },
        update: { costInr: { increment: cost } },
      })
    );
    if (env().EA_BUILD_SPEND_CAP_INR !== undefined) {
      ops.push(
        db.spendLedger.upsert({
          where: { day: BUILD_LEDGER_DAY },
          create: { day: BUILD_LEDGER_DAY, costInr: cost },
          update: { costInr: { increment: cost } },
        })
      );
    }
  }
  await db.$transaction(ops);
  await warnNearDailyCap();
}

let warnedForDay: string | null = null;

async function warnNearDailyCap(): Promise<void> {
  const day = utcDay().toISOString().slice(0, 10);
  if (warnedForDay === day) return;
  const total = await ledgerTotal(utcDay());
  if (total >= 0.8 * env().EA_DAILY_SPEND_CAP_INR) {
    warnedForDay = day;
    logger.warn({ todayInr: total, capInr: env().EA_DAILY_SPEND_CAP_INR }, 'spend_warning');
  }
}

export async function spendSummary() {
  const config = env();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const month = await db.spendLedger.aggregate({
    _sum: { costInr: true },
    where: { day: { gte: monthStart, lte: utcDay(now) } },
  });
  return {
    todayInr: await ledgerTotal(utcDay(now)),
    dailyCapInr: config.EA_DAILY_SPEND_CAP_INR,
    monthInr: Number(month._sum.costInr ?? 0),
    buildInr: config.EA_BUILD_SPEND_CAP_INR !== undefined ? await ledgerTotal(BUILD_LEDGER_DAY) : null,
    buildCapInr: config.EA_BUILD_SPEND_CAP_INR ?? null,
  };
}
