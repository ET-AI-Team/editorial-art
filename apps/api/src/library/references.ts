import { Prisma } from '@prisma/client';
import { db } from '../lib/db';

/**
 * Picking the style references sent with each image (Step 5.7): nearest approved references in
 * the style by description embedding, rescored so references that produced picked images rise
 * and one request does not reuse the same few everywhere, with at most two sharing a subject.
 */

export interface RefCandidate {
  id: string;
  url: string;
  subjects: string[];
  similarity: number;
  pickCount: number;
}

export function vectorLiteral(vector: number[]): string {
  return `[${vector.map((v) => (Number.isFinite(v) ? v : 0)).join(',')}]`;
}

export async function nearestApprovedReferences(styleId: string, vector: number[] | null, limit = 12): Promise<RefCandidate[]> {
  if (!vector) {
    const rows = await db.styleReference.findMany({
      where: { styleId, status: 'APPROVED' },
      orderBy: [{ pickCount: 'desc' }, { createdAt: 'asc' }],
      take: limit,
      select: { id: true, url: true, subjects: true, pickCount: true },
    });
    return rows.map((r) => ({ ...r, similarity: 0 }));
  }
  return db.$queryRaw<RefCandidate[]>(Prisma.sql`
    SELECT id, url, subjects, "pickCount",
           CASE WHEN embedding IS NULL THEN 0 ELSE 1 - (embedding <=> ${vectorLiteral(vector)}::vector) END AS similarity
    FROM "StyleReference"
    WHERE "styleId" = ${styleId} AND status = 'APPROVED'
    ORDER BY similarity DESC, "pickCount" DESC
    LIMIT ${limit}`);
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
