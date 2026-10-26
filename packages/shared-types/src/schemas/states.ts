import { z } from 'zod';

export const RequestStatus = z.enum([
  'RECEIVED',
  'READING',
  'DIRECTIONS_READY',
  'ACTIVE',
  'HAS_FINAL',
  'FAILED',
  'CANCELLED',
  'EXPIRED',
]);
export type RequestStatus = z.infer<typeof RequestStatus>;

export const BatchStatus = z.enum(['QUEUED', 'RUNNING', 'READY', 'PARTIAL', 'FAILED', 'CANCELLED']);
export type BatchStatus = z.infer<typeof BatchStatus>;

export const OptionState = z.enum([
  'PENDING',
  'GENERATING',
  'PREVIEW_READY',
  'PREVIEW_FAILED',
  'BLOCKED',
  'FINALIZING',
  'FINAL_READY',
  'FINAL_FAILED',
  'PACKING',
  'PACK_READY',
  'PACK_FAILED',
]);
export type OptionState = z.infer<typeof OptionState>;

export const BatchKind = z.enum(['INITIAL', 'MORE', 'ANOTHER_STYLE', 'SERIES_MATCH']);
export type BatchKind = z.infer<typeof BatchKind>;

export const PackStatus = z.enum(['PENDING', 'READY', 'FAILED']);
export type PackStatus = z.infer<typeof PackStatus>;

/** ET Articles makes one square image. */
export const PACK_SIZES = ['1x1'] as const;
export const PackSize = z.enum(PACK_SIZES);
export type PackSize = z.infer<typeof PackSize>;

export const StyleStatus = z.enum(['DRAFT', 'CURATING', 'LIVE', 'RETIRED']);
export const RefStatus = z.enum(['CANDIDATE', 'APPROVED', 'REJECTED', 'RETIRED']);
export const RefSource = z.enum(['GENERATED', 'ET_ARCHIVE', 'LICENSED']);
