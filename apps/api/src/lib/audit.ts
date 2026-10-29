import { db } from './db';
import { logger } from './logger';

export type AuditAction =
  | 'request.create'
  | 'request.cancel'
  | 'batch.create'
  | 'option.finalize'
  | 'style.update'
  | 'style.publish'
  | 'style.retire'
  | 'style.generate'
  | 'reference.review'
  | 'reference.upload'
  | 'likeness.create'
  | 'likeness.update'
  | 'likeness.use'
  | 'people.pause'
  | 'people.decision'
  | 'spend.cap_reached'
  | 'setting.image_models';

/** Appends to the audit log. Never throws: a failed audit write is logged, not fatal. */
export async function audit(entry: {
  action: AuditAction;
  targetType: string;
  targetId: string;
  actorUserId?: string | null;
  callerKeyId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.auditEvent.create({
      data: {
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        actorUserId: entry.actorUserId ?? null,
        callerKeyId: entry.callerKeyId ?? null,
        metadata: (entry.metadata ?? {}) as object,
      },
    });
  } catch (err) {
    logger.error({ err, action: entry.action }, 'audit_write_failed');
  }
}
