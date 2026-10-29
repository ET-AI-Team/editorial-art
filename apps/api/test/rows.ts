import { db } from '../src/lib/db';
import { newPublicRequestId } from '../src/lib/ids';
import { ARTICLE } from './harness';

/** A request row as the create route makes it, without going through HTTP or the read queue. */
export async function requestRow(overrides: { articleTitle?: string | null; articleText?: string; spendCapInr?: number; styleId?: string | null } = {}) {
  const text = overrides.articleText ?? ARTICLE;
  return db.request.create({
    data: {
      publicId: newPublicRequestId(),
      callerKeyId: 'test',
      actorUserId: '11111111-1111-4111-8111-111111111111',
      actorWorkspaceId: '22222222-2222-4222-8222-222222222222',
      articleTitle: overrides.articleTitle === undefined ? 'Tata Sons rejects Noel Tata objections' : overrides.articleTitle,
      articleText: text,
      articleHash: `h-${Math.random()}`,
      articleChars: text.length,
      articleExcerpt: text.slice(0, 400),
      styleId: overrides.styleId ?? null,
      spendCapInr: overrides.spendCapInr ?? 200,
      expiresAt: new Date(Date.now() + 86_400_000),
    },
  });
}
