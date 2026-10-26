/**
 * Which screened artworks a style keeps: the best `perArtist` of each artist by score, then up to
 * `perStyle` in all, taken round-robin across artists (best artist first) so no one artist
 * crowds out the others.
 */
export function selectKept<T extends { artist: { slug: string }; onStyle: number }>(items: T[], perArtist = 8, perStyle = 24): T[] {
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
