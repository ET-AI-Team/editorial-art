import { z } from 'zod';

export const Id = z.string().uuid();
/** `ear_` plus 22 base62 characters: the id AI Studio and the logs see. */
export const PublicRequestId = z.string().regex(/^ear_[A-Za-z0-9]{22}$/, 'not a request id');
export const Iso = z.string().datetime();
export const Slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'not a slug');

// Newline, carriage return and tab are allowed; every other C0 control character is not.
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

/** Text from a person: bounded, and free of control characters. */
export function safeText(min: number, max: number) {
  return z
    .string()
    .min(min, `must be at least ${min} characters`)
    .max(max, `must be at most ${max} characters`)
    .refine((s) => !CONTROL.test(s), 'contains control characters');
}

export const SensitivityLevel = z.enum(['NONE', 'ELEVATED', 'HIGH', 'BLOCKED']);
export type SensitivityLevel = z.infer<typeof SensitivityLevel>;

/** Ordering of sensitivity levels; the higher of two readings always wins. */
export const SENSITIVITY_ORDER: Record<SensitivityLevel, number> = { NONE: 0, ELEVATED: 1, HIGH: 2, BLOCKED: 3 };

export function higherSensitivity(a: SensitivityLevel, b: SensitivityLevel): SensitivityLevel {
  return SENSITIVITY_ORDER[a] >= SENSITIVITY_ORDER[b] ? a : b;
}
