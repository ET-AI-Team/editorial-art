import type { ImageSize, SentImage, SentImageCall } from '@editorial-art/shared-types';
import { StageError } from '../lib/errors';
import { imageEstimateInr } from '../lib/pricing';
import { imageModelChain, providerOf } from '../lib/settings';
import { ProviderRefusal, type ImageData, type ImageGenResult } from '../providers';
import { generateImage, type CallContext } from './ai';
import { imageLabels } from './prompts';

/**
 * One image call by the model the admin setting chose, with the provider taken from the model.
 * If that model fails or refuses, one model from the other provider is tried, so one provider's
 * outage or refusal never decides on its own.
 */

export interface RoutedImage {
  result: ImageGenResult;
  /** The model that made the image, as the provider reported it. */
  model: string;
  /** Exactly what was sent to that model, for the option's audit trail. */
  sent: SentImageCall;
}

export interface ImageRequest {
  stage: 'preview' | 'final';
  model: string;
  imageSize: ImageSize;
  prompt: string;
  images: ImageData[];
  sources: SentImage[];
  likenessNames: string[];
}

export function describeCall(model: string, prompt: string, sources: SentImage[], labels: string[]): SentImageCall {
  return { model, prompt, images: sources.map((s, i) => ({ ...s, label: labels[i] })) };
}

export async function routedImage(ctx: CallContext, req: ImageRequest): Promise<RoutedImage> {
  const labels = imageLabels(
    req.sources.map((s) => s.role),
    req.likenessNames
  );
  const models = imageModelChain(req.model);
  let refusals = 0;
  let lastError: unknown;
  for (const model of models) {
    try {
      const result = await generateImage(
        ctx,
        {
          provider: providerOf(model),
          model,
          prompt: req.prompt,
          images: req.images,
          labels,
          aspectRatio: '1:1',
          // Editors choose from the previews, so they are made at full quality too.
          quality: 'high',
          imageSize: req.imageSize,
          timeoutMs: req.imageSize === '4K' ? 300_000 : 180_000,
        },
        imageEstimateInr(model, req.imageSize)
      );
      return { result, model: result.model, sent: describeCall(result.model, req.prompt, req.sources, labels) };
    } catch (error) {
      if (error instanceof StageError && error.code === 'SPEND_CAP_REACHED') throw error;
      if (error instanceof ProviderRefusal) refusals++;
      lastError = error;
    }
  }
  // Every model refused: for a preview this blocks the idea.
  if (refusals === models.length) throw new ProviderRefusal(models[models.length - 1]!, "This idea couldn't be illustrated safely. Try More options.");
  throw lastError;
}
