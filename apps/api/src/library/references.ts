import { Prisma } from '@prisma/client';
import { db } from '../lib/db';

/**
 * Picking the style references sent with each image (Step 5.7): nearest approved references in
 * the style by description embedding, rescored so references that produced picked images rise
 * and one request does not reuse the same few everywhere, with at most two sharing a subject.
 *
 * With the artist library, the three references of one option come from one artist, so the
 * model sees one coherent hand, and the four options of a batch come from four different
 * artists where the style has them.
 */

export interface RefCandidate {
  id: string;
  url: string;
  subjects: string[];
  similarity: number;
  pickCount: number;
  /** Null for generated, archive and licensed references. */
  artistId: string | null;
}

/** How many nearest references the artist choice looks at. */
export const ARTIST_POOL = 40;

export function vectorLiteral(vector: number[]): string {
  return `[${vector.map((v) => (Number.isFinite(v) ? v : 0)).join(',')}]`;
}

export async function nearestApprovedReferences(
  styleId: string,
  vector: number[] | null,
  limit = ARTIST_POOL,
  opts: { artistId?: string } = {}
): Promise<RefCandidate[]> {
  if (!vector) {
    const rows = await db.styleReference.findMany({
      where: { styleId, status: 'APPROVED', ...(opts.artistId ? { artistId: opts.artistId } : {}) },
      orderBy: [{ pickCount: 'desc' }, { createdAt: 'asc' }],
      take: limit,
      select: { id: true, url: true, subjects: true, pickCount: true, artistId: true },
    });
    return rows.map((r) => ({ ...r, similarity: 0 }));
  }
  const byArtist = opts.artistId ? Prisma.sql`AND "artistId" = ${opts.artistId}` : Prisma.empty;
  return db.$queryRaw<RefCandidate[]>(Prisma.sql`
    SELECT id, url, subjects, "pickCount", "artistId",
           CASE WHEN embedding IS NULL THEN 0 ELSE 1 - (embedding <=> ${vectorLiteral(vector)}::vector) END AS similarity
    FROM "StyleReference"
    WHERE "styleId" = ${styleId} AND status = 'APPROVED' ${byArtist}
    ORDER BY similarity DESC, "pickCount" DESC
    LIMIT ${limit}`);
}

/** A reference without an artist is its own group, so older libraries still spread across options. */
export function artistKey(c: Pick<RefCandidate, 'id' | 'artistId'>): string {
  return c.artistId ?? `ref:${c.id}`;
}

/** Candidates grouped by artist, each scored by the mean similarity of its best three. */
export function artistGroups(candidates: RefCandidate[]): { key: string; refs: RefCandidate[]; score: number }[] {
  const groups = new Map<string, RefCandidate[]>();
  for (const c of candidates) groups.set(artistKey(c), [...(groups.get(artistKey(c)) ?? []), c]);
  return [...groups]
    .map(([key, refs]) => {
      const top = refs.map((r) => Number(r.similarity)).sort((a, b) => b - a).slice(0, 3);
      return { key, refs, score: top.reduce((sum, x) => sum + x, 0) / top.length };
    })
    .sort((a, b) => b.score - a.score || b.refs.length - a.refs.length);
}

/**
 * The artist for one option: the best-scoring artist not yet used in this batch and not used
 * earlier in the request; then one only used earlier in the request; then, when the style has
 * fewer artists than options, the one used least in this batch.
 */
export function pickArtist(
  groups: { key: string; score: number }[],
  usedInBatch: Map<string, number>,
  usedInRequest: Set<string>
): string | null {
  if (!groups.length) return null;
  const fresh = groups.find((g) => !usedInBatch.has(g.key) && !usedInRequest.has(g.key));
  if (fresh) return fresh.key;
  const notInBatch = groups.find((g) => !usedInBatch.has(g.key));
  if (notInBatch) return notInBatch.key;
  return [...groups].sort((a, b) => (usedInBatch.get(a.key) ?? 0) - (usedInBatch.get(b.key) ?? 0) || b.score - a.score)[0]!.key;
}

/**
 * The three references for one option: one artist's (see pickArtist), chosen with
 * chooseReferences. A reference without an artist is topped up from the other references
 * without one, so an older library still sends three.
 */
export function chooseByArtist(
  candidates: RefCandidate[],
  usedRefs: Map<string, number>,
  usedInBatch: Map<string, number>,
  usedInRequest: Set<string>,
  count = 3
): { artistKey: string | null; refs: RefCandidate[] } {
  const groups = artistGroups(candidates);
  const key = pickArtist(groups, usedInBatch, usedInRequest);
  if (key === null) return { artistKey: null, refs: [] };
  const group = groups.find((g) => g.key === key)!;
  const refs = chooseReferences(group.refs, usedRefs, count);
  if (refs.length < count && key.startsWith('ref:')) {
    const others = candidates.filter((c) => c.artistId === null && !refs.includes(c));
    refs.push(...chooseReferences(others, usedRefs, count - refs.length));
  }
  return { artistKey: key, refs };
}

/** Pure: rescoring and the diversity rule, so it is testable without a database. */
export function chooseReferences(candidates: RefCandidate[], usedInRequest: Map<string, number>, count = 3): RefCandidate[] {
  const scored = candidates
    .map((c) => ({ c, score: Number(c.similarity) + 0.03 * Math.log1p(c.pickCount) - 0.02 * (usedInRequest.get(c.id) ?? 0) }))
    .sort((a, b) => b.score - a.score);
  const chosen: RefCandidate[] = [];
  const subjectCount = new Map<string, number>();
  for (const { c } of scored) {
    const first = c.subjects[0] ?? 'none';
    if ((subjectCount.get(first) ?? 0) >= 2) continue;
    chosen.push(c);
    subjectCount.set(first, (subjectCount.get(first) ?? 0) + 1);
    if (chosen.length === count) return chosen;
  }
  // Too few distinct subjects: fill from the best remaining.
  for (const { c } of scored) {
    if (chosen.length === count) break;
    if (!chosen.includes(c)) chosen.push(c);
  }
  return chosen;
}

export async function storeEmbedding(referenceId: string, vector: number[], model: string): Promise<void> {
  await db.$executeRaw`UPDATE "StyleReference" SET embedding = ${vectorLiteral(vector)}::vector, "embeddingModel" = ${model} WHERE id = ${referenceId}`;
}
