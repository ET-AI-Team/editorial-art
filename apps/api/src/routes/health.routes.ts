import { Router } from 'express';
import { db } from '../lib/db';
import { redis } from '../lib/redis';

export const healthRouter = Router();

/** Up or not. No detail, no key needed. */
healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

function within<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}

/** Ready to serve: Postgres and Redis both answer within a second. */
healthRouter.get('/ready', async (_req, res) => {
  const checks = await Promise.allSettled([within(db.$queryRaw`SELECT 1`, 1000), within(redis().ping(), 1000)]);
  const failing = (['postgres', 'redis'] as const).filter((_, i) => checks[i]?.status === 'rejected');
  if (failing.length) {
    res.status(503).json({ status: 'not_ready', failing });
    return;
  }
  res.json({ status: 'ready' });
});
