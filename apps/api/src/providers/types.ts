import { StageError } from '../lib/errors';

/** An image held in memory, as sent to or received from a model. */
export interface ImageData {
  buffer: Buffer;
  mimeType: string;
}

export type AspectRatio = '1:1';

/** Every structured model answer this service asks for, so fakes can answer each kind. */
export type ChatKind = 'read' | 'judge' | 'alt_text' | 'describe_reference' | 'screen_exemplar' | 'screen_artwork' | 'preview_text';

export interface ChatJsonParams {
  kind: ChatKind;
  model: string;
  system: string;
  user: string;
  images?: ImageData[];
  /** Vision detail for attached images; low unless a check needs fine detail (signatures, small marks). */
  imageDetail?: 'low' | 'high';
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface ChatUsage {
  input: number;
  cachedInput: number;
  output: number;
}

export interface ChatJsonResult {
  json: unknown;
  usage: ChatUsage | null;
  model: string;
}

export interface ImageGenParams {
  model: string;
  prompt: string;
  images: ImageData[];
  aspectRatio: AspectRatio;
  timeoutMs?: number;
}

export interface ImageGenResult {
  image: ImageData;
  model: string;
  usage: { input?: number; textOutput?: number; imageOutput?: number; textInput?: number; imageInput?: number; output?: number } | null;
}

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
}

/** The narrow surface the pipeline uses. Real and fake implementations both satisfy it. */
export interface Providers {
  chatJson(params: ChatJsonParams): Promise<ChatJsonResult>;
  embed(model: string, text: string): Promise<{ vector: number[]; tokens: number }>;
  geminiImage(params: ImageGenParams): Promise<ImageGenResult>;
  openaiImageEdit(params: ImageGenParams): Promise<ImageGenResult>;
  upload(image: ImageData, opts: { folder: string; publicId: string; format: 'webp' | 'png' | 'jpg'; tags?: string[] }): Promise<UploadResult>;
  destroy(publicId: string): Promise<void>;
  /** Downloads an image this service stored, bounded to `maxWidth` through a delivery transform. */
  fetchImage(url: string, maxWidth?: number): Promise<ImageData>;
}

/** The model declined on safety grounds. Never retried with the same model. */
export class ProviderRefusal extends StageError {
  constructor(readonly model: string, reason: string) {
    super('PROVIDER_REFUSED', reason, false);
  }
}

export class ProviderUnavailable extends StageError {
  constructor(readonly status: number | null, message: string) {
    super('PROVIDER_UNAVAILABLE', message, true);
  }
}

export class ProviderTimeout extends StageError {
  constructor(message = 'The model did not answer in time.') {
    super('PROVIDER_TIMEOUT', message, true);
  }
}

export class BadModelOutput extends StageError {
  constructor(message: string) {
    super('BAD_MODEL_OUTPUT', message, true);
  }
}
