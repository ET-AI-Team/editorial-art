import { z } from 'zod';
import { Id, PublicRequestId } from './schemas/common';
import { BatchStatus, OptionState, RequestStatus } from './schemas/states';

/**
 * Socket.IO events. Payloads are small on purpose: a client refetches the request for full
 * data, so an event only has to say what changed.
 */
export const ServerEvents = {
  'request:status': z.object({ requestId: PublicRequestId, status: RequestStatus }),
  'request:directions_ready': z.object({ requestId: PublicRequestId }),
  'batch:created': z.object({ requestId: PublicRequestId, batchId: Id, seq: z.number().int() }),
  'option:preview_ready': z.object({ requestId: PublicRequestId, batchId: Id, optionId: Id, previewUrl: z.string().url() }),
  'option:failed': z.object({ requestId: PublicRequestId, optionId: Id, state: OptionState, reason: z.string() }),
  'batch:settled': z.object({ requestId: PublicRequestId, batchId: Id, status: BatchStatus }),
  'option:final_ready': z.object({ requestId: PublicRequestId, optionId: Id, finalUrl: z.string().url() }),
  'option:pack_ready': z.object({ requestId: PublicRequestId, optionId: Id }),
} as const;

export type ServerEventName = keyof typeof ServerEvents;
export type ServerEventPayload<E extends ServerEventName> = z.infer<(typeof ServerEvents)[E]>;

export const ClientEvents = {
  'join:request': z.object({ requestId: PublicRequestId }),
  'leave:request': z.object({ requestId: PublicRequestId }),
} as const;

export function requestRoom(requestId: string): string {
  return `request:${requestId}`;
}
