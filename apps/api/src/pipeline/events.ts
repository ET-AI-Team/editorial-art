import type { BatchStatus, OptionState, RequestStatus } from '@editorial-art/shared-types';
import { emit } from '../realtime/socket-server';

/** Thin, typed wrappers so stages never build event payloads by hand. */

export function emitRequestStatus(requestId: string, status: RequestStatus, opts: { directionsReady?: boolean } = {}): void {
  emit('request:status', { requestId, status });
  if (opts.directionsReady) emit('request:directions_ready', { requestId });
}

export function emitBatchCreated(requestId: string, batchId: string, seq: number): void {
  emit('batch:created', { requestId, batchId, seq });
}

export function emitBatchSettled(requestId: string, batchId: string, status: BatchStatus): void {
  emit('batch:settled', { requestId, batchId, status });
}

export function emitPreviewReady(requestId: string, batchId: string, optionId: string, previewUrl: string): void {
  emit('option:preview_ready', { requestId, batchId, optionId, previewUrl });
}

export function emitOptionFailed(requestId: string, optionId: string, state: OptionState, reason: string): void {
  emit('option:failed', { requestId, optionId, state, reason });
}

export function emitFinalReady(requestId: string, optionId: string, finalUrl: string): void {
  emit('option:final_ready', { requestId, optionId, finalUrl });
}

export function emitPackReady(requestId: string, optionId: string): void {
  emit('option:pack_ready', { requestId, optionId });
}
