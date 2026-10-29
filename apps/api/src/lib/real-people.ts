import { env } from './env';

/**
 * The real-people gate (EA_REAL_PEOPLE). Off: every person is drawn symbolically, exactly as
 * before real faces existed. Admins: only requests made by an admin (x-actor-role) look people up
 * on Wikidata and draw their faces. All: everyone does.
 */
export type RealPeopleMode = 'off' | 'admins' | 'all';

export function realPeopleAllowed(role: string | null | undefined, mode: RealPeopleMode = env().EA_REAL_PEOPLE): boolean {
  if (mode === 'all') return true;
  if (mode === 'admins') return role === 'admin';
  return false;
}
