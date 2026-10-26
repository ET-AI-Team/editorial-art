import axios from 'axios';
import { env } from '../lib/env';
import { mapAxiosError } from './http';
import { BadModelOutput, ProviderRefusal, type ImageGenParams, type ImageGenResult } from './types';

export const geminiHttp = axios.create({ baseURL: 'https://generativelanguage.googleapis.com/v1beta' });

/** finishReason values that mean "declined", not "broke". */
const REFUSAL_REASONS = new Set(['SAFETY', 'PROHIBITED_CONTENT', 'IMAGE_SAFETY', 'BLOCKLIST', 'SPII', 'RECITATION', 'IMAGE_PROHIBITED_CONTENT', 'IMAGE_RECITATION']);

interface GeminiResponse {
  modelVersion?: string;
  promptFeedback?: { blockReason?: string };
  candidates?: { finishReason?: string; content?: { parts?: { text?: string; inlineData?: { mimeType?: string; data?: string } }[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; candidatesTokensDetails?: { modality?: string; tokenCount?: number }[] };
}

/**
 * Image generation with inline reference images. Same request shape as design-pipeline's
 * gemini.client.ts (`generationConfig.imageConfig.aspectRatio`).
 */
export async function generateImage(p: ImageGenParams): Promise<ImageGenResult> {
  const parts: unknown[] = [{ text: p.prompt }];
  for (const image of p.images) {
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.buffer.toString('base64') } });
  }
  let data: GeminiResponse;
  try {
    const res = await geminiHttp.post(
      `/models/${p.model}:generateContent`,
      { contents: [{ role: 'user', parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: p.aspectRatio } } },
      { headers: { 'x-goog-api-key': env().GEMINI_API_KEY ?? '' }, timeout: p.timeoutMs ?? 120_000 }
    );
    data = res.data;
  } catch (error) {
    throw mapAxiosError(error, 'Gemini');
  }

  if (data.promptFeedback?.blockReason) throw new ProviderRefusal(p.model, 'The image model declined this request.');
  const candidate = data.candidates?.[0];
  if (candidate?.finishReason && REFUSAL_REASONS.has(candidate.finishReason)) {
    throw new ProviderRefusal(p.model, 'The image model declined this request.');
  }
  const part = candidate?.content?.parts?.find((x) => x.inlineData?.data);
  if (!part?.inlineData?.data) {
    // A text-only answer with no image is how a soft refusal usually looks.
    if (candidate?.content?.parts?.some((x) => x.text)) throw new ProviderRefusal(p.model, 'The image model answered without an image.');
    throw new BadModelOutput('The image model returned no image.');
  }

  const usage = data.usageMetadata;
  const imageOutput = usage?.candidatesTokensDetails?.find((d) => d.modality === 'IMAGE')?.tokenCount;
  return {
    image: { buffer: Buffer.from(part.inlineData.data, 'base64'), mimeType: part.inlineData.mimeType ?? 'image/png' },
    model: data.modelVersion ?? p.model,
    usage: usage
      ? {
          input: usage.promptTokenCount,
          imageOutput: imageOutput ?? usage.candidatesTokenCount,
          textOutput: imageOutput !== undefined ? Math.max(0, (usage.candidatesTokenCount ?? 0) - imageOutput) : 0,
        }
      : null,
  };
}
