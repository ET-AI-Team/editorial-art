import { env } from './env';
import type { RealPeopleMode } from './real-people';

/**
 * The brand-logo gate (EA_BRAND_LOGOS), the same shape as the real-people gate. Off: no image ever
 * carries a logo, exactly as before logos existed. Admins: only requests made by an admin
 * (x-actor-role). All: everyone.
 */
export type BrandLogosMode = RealPeopleMode;

export function brandLogosAllowed(role: string | null | undefined, mode: BrandLogosMode = env().EA_BRAND_LOGOS): boolean {
  if (mode === 'all') return true;
  if (mode === 'admins') return role === 'admin';
  return false;
}
