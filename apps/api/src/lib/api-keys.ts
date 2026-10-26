import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import { env } from './env';

/**
 * The internal API key AI Studio sends as `x-api-key` (and as `auth.apiKey` on the socket
 * handshake). Same scheme as design-pipeline: several comma-separated keys so one can be rotated,
 * and every comparison hashes both sides and uses timingSafeEqual.
 */

const digest = (s: string) => createHash('sha256').update(s, 'utf8').digest();

export function configuredApiKeys(): string[] {
  return env()
    .EA_INTERNAL_API_KEYS.split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

export function isValidApiKey(candidate: string | undefined | null): boolean {
  if (!candidate) return false;
  const c = digest(candidate);
  let ok = false;
  // Compare against every key, without an early exit, so timing does not reveal which matched.
  for (const key of configuredApiKeys()) {
    if (timingSafeEqual(c, digest(key))) ok = true;
  }
  return ok;
}

export function apiKeyFrom(headers: IncomingHttpHeaders, auth?: Record<string, unknown>): string | undefined {
  if (typeof auth?.apiKey === 'string' && auth.apiKey) return auth.apiKey;
  const h = headers['x-api-key'];
  return Array.isArray(h) ? h[0] : h;
}

/** First 6 hex characters of the key's sha256: enough to tell keys apart, useless to an attacker. */
export function keyFingerprint(key: string): string {
  return digest(key).toString('hex').slice(0, 6);
}
