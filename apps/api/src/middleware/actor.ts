import type { RequestHandler } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/errors';

/**
 * Who the call is for, as AI Studio says. Trusted only because the API key check ran first; a
 * caller without the key never reaches here.
 */
const Actor = z.object({
  userId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  role: z.enum(['admin', 'member']),
});
export type Actor = z.infer<typeof Actor>;

export const requireActor: RequestHandler = (req, _res, next) => {
  const parsed = Actor.safeParse({
    userId: req.header('x-actor-user-id'),
    workspaceId: req.header('x-actor-workspace-id'),
    role: req.header('x-actor-role'),
  });
  if (!parsed.success) {
    return next(ApiError.validation(parsed.error.flatten(), 'The actor headers are missing or invalid.'));
  }
  req.actor = parsed.data;
  next();
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.actor?.role !== 'admin') return next(new ApiError('FORBIDDEN', 403, 'Only admins can do this.'));
  next();
};

export function actorOf(req: { actor?: Actor }): Actor {
  if (!req.actor) throw new ApiError('UNAUTHENTICATED', 401, 'No actor on this request.');
  return req.actor;
}
