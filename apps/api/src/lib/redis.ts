import IORedis, { type Redis } from 'ioredis';
import { env } from './env';

let shared: Redis | undefined;

/**
 * The connection BullMQ and the rate limiter share. `maxRetriesPerRequest: null` is required by
 * BullMQ's blocking commands.
 */
export function redis(): Redis {
  shared ??= new IORedis(env().REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: true, lazyConnect: false });
  return shared;
}

export async function closeRedis(): Promise<void> {
  if (shared) {
    await shared.quit().catch(() => shared?.disconnect());
    shared = undefined;
  }
}
