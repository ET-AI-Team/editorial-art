import { randomBytes } from 'node:crypto';

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** `ear_` plus 22 base62 characters (about 131 bits of randomness). */
export function newPublicRequestId(): string {
  const bytes = randomBytes(22);
  let out = 'ear_';
  for (const b of bytes) out += BASE62[b % 62];
  return out;
}

export function isPublicRequestId(s: string): boolean {
  return /^ear_[A-Za-z0-9]{22}$/.test(s);
}

export function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}
