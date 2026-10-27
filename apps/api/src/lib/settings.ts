import {
  IMAGE_MODEL_OPTIONS,
  ImageModelId,
  ImageModelSetting,
  providerOfModel,
  type ImageModelId as ImageModelIdT,
  type ImageModelSetting as ImageModelSettingT,
  type ImageProvider,
} from '@editorial-art/shared-types';
import { db } from './db';
import { env } from './env';
import { logger } from './logger';
import { imageEstimateInr } from './pricing';

/**
 * Which image models make previews and finals, and how large finals are. Admins change it at run
 * time (the "image-models" row of Setting); until they do, EA_PREVIEW_MODEL, EA_FINAL_MODEL and
 * EA_FINAL_IMAGE_SIZE decide. Each process keeps
 * it for 30 seconds, so a change reaches every worker within that.
 */

const KEY = 'image-models';
const TTL_MS = 30_000;

let cached: { at: number; value: Promise<ImageModelSettingT> } | undefined;

/** A model id from the environment, or the built-in default when it is not one admins can pick. */
function fromEnv(value: string, name: string, fallback: ImageModelIdT): ImageModelIdT {
  const parsed = ImageModelId.safeParse(value);
  if (parsed.success) return parsed.data;
  logger.warn({ variable: name, fallback }, 'image_model_env_not_selectable');
  return fallback;
}

export function defaultImageModels(): ImageModelSettingT {
  const config = env();
  return {
    previewModel: fromEnv(config.EA_PREVIEW_MODEL, 'EA_PREVIEW_MODEL', 'gemini-3.1-flash-image'),
    finalModel: fromEnv(config.EA_FINAL_MODEL, 'EA_FINAL_MODEL', 'gemini-3-pro-image'),
    finalImageSize: config.EA_FINAL_IMAGE_SIZE,
  };
}

async function load(): Promise<ImageModelSettingT> {
  const defaults = defaultImageModels();
  const row = await db.setting.findUnique({ where: { key: KEY } });
  if (!row) return defaults;
  // A stored value is merged over the defaults, so a model removed from the list falls back.
  const stored = ImageModelSetting.partial().safeParse(row.value);
  return stored.success ? { ...defaults, ...stored.data } : defaults;
}

export function imageModels(): Promise<ImageModelSettingT> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const value = load();
  cached = { at: Date.now(), value };
  value.catch(() => {
    cached = undefined;
  });
  return value;
}

export async function setImageModels(patch: Partial<ImageModelSettingT>, updatedBy: string | null): Promise<ImageModelSettingT> {
  const next = { ...(await load()), ...patch };
  await db.setting.upsert({ where: { key: KEY }, create: { key: KEY, value: next, updatedBy }, update: { value: next, updatedBy } });
  cached = undefined;
  return next;
}

export function imageModelOptions() {
  return IMAGE_MODEL_OPTIONS.map((o) => ({ ...o }));
}

export function providerOf(model: string): ImageProvider {
  return providerOfModel(model);
}

/** The one model tried when the chosen one fails or refuses: always from the other provider. */
export function crossProviderFallback(model: string): ImageModelIdT {
  return providerOf(model) === 'gemini' ? 'gpt-image-2' : 'gemini-3-pro-image';
}

/** One preview by the chosen model at the configured size, for the spend guard. */
export async function previewEstimateInr(): Promise<number> {
  return imageEstimateInr((await imageModels()).previewModel, env().EA_PREVIEW_IMAGE_SIZE);
}

/** Tests only. */
export function resetSettingsCacheForTests(): void {
  cached = undefined;
}
