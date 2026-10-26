import type { Server as HttpServer } from 'node:http';
import { ClientEvents, requestRoom, type ServerEventName, type ServerEventPayload, ServerEvents } from '@editorial-art/shared-types';
import { Server } from 'socket.io';
import { apiKeyFrom, isValidApiKey } from '../lib/api-keys';
import { env } from '../lib/env';
import { logger } from '../lib/logger';

/**
 * Live updates for AI Studio's relay, the only client. The handshake needs the internal key, the
 * same as HTTP. Clients join a room per request and refetch on each event.
 */

let io: Server | undefined;

export function attachSocketServer(http: HttpServer): Server {
  io = new Server(http, { serveClient: false, cors: { origin: false } });
  io.use((socket, next) => {
    const key = apiKeyFrom(socket.handshake.headers, socket.handshake.auth as Record<string, unknown>);
    if (isValidApiKey(key)) return next();
    if (env().EA_API_KEY_REQUIRED) return next(new Error('unauthorized'));
    next();
  });
  io.on('connection', (socket) => {
    socket.on('join:request', (payload: unknown) => {
      const parsed = ClientEvents['join:request'].safeParse(payload);
      if (parsed.success) void socket.join(requestRoom(parsed.data.requestId));
    });
    socket.on('leave:request', (payload: unknown) => {
      const parsed = ClientEvents['leave:request'].safeParse(payload);
      if (parsed.success) void socket.leave(requestRoom(parsed.data.requestId));
    });
  });
  return io;
}

/** Emits to a request's room. Payloads are validated outside production to catch drift early. */
export function emit<E extends ServerEventName>(event: E, payload: ServerEventPayload<E>): void {
  if (env().NODE_ENV !== 'production') {
    const parsed = ServerEvents[event].safeParse(payload);
    if (!parsed.success) logger.error({ event, issues: parsed.error.issues }, 'socket_payload_invalid');
  }
  io?.to(requestRoom((payload as { requestId: string }).requestId)).emit(event, payload);
}

export async function closeSocketServer(): Promise<void> {
  if (!io) return;
  await new Promise<void>((resolve) => io!.close(() => resolve()));
  io = undefined;
}
