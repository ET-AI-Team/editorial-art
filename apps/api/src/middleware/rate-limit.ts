import type { RequestHandler } from 'express';
import { ApiError } from '../lib/errors';
import { redis } from '../lib/redis';
import { env } from '../lib/env';

/**
 * Sliding one-hour window in a Redis sorted set per key. A limit that cannot be checked (Redis
 * down) lets the call through: availability over strictness, since spend caps still hold.
 */
export async function hitLimit(key: string, limit: number, windowSec = 3600): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const now = Date.now();
  const redisKey = `${env().EA_QUEUE_PREFIX}:rl:${key}`;
  const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;
  const results = await redis()
    .multi()
    .zremrangebyscore(redisKey, 0, now - windowSec * 1000)
    .zadd(redisKey, now, member)
    .zcard(redisKey)
    .zrange(redisKey, 0, 0, 'WITHSCORES')
    .expire(redisKey, windowSec)
    .exec();
  const count = Number(results?.[2]?.[1] ?? 0);
  if (count <= limit) return { allowed: true, retryAfterSec: 0 };
  await redis().zrem(redisKey, member);
  const oldest = Number((results?.[3]?.[1] as string[] | undefined)?.[1] ?? now);
  return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((oldest + windowSec * 1000 - now) / 1000)) };
}

type Scope = 'create' | 'batch' | 'finalize' | 'library';

function limitFor(scope: Scope): number {
  const c = env();
  return { create: c.EA_RATE_CREATE_PER_HOUR, batch: c.EA_RATE_BATCH_PER_HOUR, finalize: c.EA_RATE_FINALIZE_PER_HOUR, library: c.EA_RATE_LIBRARY_PER_HOUR }[scope];
}

/** Per-user limit for the scope, plus the per-workspace limit on all writes. */
export function rateLimit(scope: Scope): RequestHandler {
  return async (req, _res, next) => {
    const actor = req.actor;
    if (!actor) return next();
    try {
      const user = await hitLimit(`${scope}:u:${actor.userId}`, limitFor(scope));
      const workspace = user.allowed
        ? await hitLimit(`write:w:${actor.workspaceId}`, env().EA_RATE_WORKSPACE_WRITES_PER_HOUR)
        : user;
      if (!workspace.allowed) {
        const minutes = Math.ceil(workspace.retryAfterSec / 60);
        return next(
          new ApiError('RATE_LIMITED', 429, `You've made a lot of requests in the last hour. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`, {
            retryAfterSec: workspace.retryAfterSec,
          })
        );
      }
    } catch {
      // Redis unavailable: let it through (see the note above).
    }
    next();
  };
}
