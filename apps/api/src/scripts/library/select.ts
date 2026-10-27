/**
 * Which screened artworks a style keeps: the best `perArtist` of each artist by score, then up to
 * `perStyle` in all, taken round-robin across artists (best artist first) so no one artist
 * crowds out the others.
 */
export const DEFAULT_PER_ARTIST = 8;
export const DEFAULT_PER_STYLE = 24;

export function selectKept<T extends { artist: { slug: string }; onStyle: number }>(items: T[], perArtist = DEFAULT_PER_ARTIST, perStyle = DEFAULT_PER_STYLE): T[] {
  const byArtist = new Map<string, T[]>();
  for (const item of items) byArtist.set(item.artist.slug, [...(byArtist.get(item.artist.slug) ?? []), item]);
  const lists = [...byArtist.values()]
    .map((list) => [...list].sort((a, b) => b.onStyle - a.onStyle).slice(0, perArtist))
    .sort((a, b) => (b[0]?.onStyle ?? 0) - (a[0]?.onStyle ?? 0) || b.length - a.length);
  const kept: T[] = [];
  for (let round = 0; kept.length < perStyle; round++) {
    let added = false;
    for (const list of lists) {
      const item = list[round];
      if (!item) continue;
      kept.push(item);
      added = true;
      if (kept.length === perStyle) break;
    }
    if (!added) break;
  }
  return kept;
}

/** A cap from a flag such as `--max-per-artist`: a whole number from 1 to 500, or the default. */
export function capFlag(value: string | boolean | undefined, name: string, fallback: number): number {
  if (value === undefined) return fallback;
  const n = typeof value === 'string' && value.trim() ? Number(value) : NaN;
  if (!Number.isInteger(n) || n < 1 || n > 500) throw new Error(`${name} must be a whole number from 1 to 500.`);
  return n;
}
