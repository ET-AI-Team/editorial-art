import axios from 'axios';
import { env } from '../lib/env';
import { mapAxiosError } from './http';
import { BadModelOutput, ProviderRefusal, type ChatJsonParams, type ChatJsonResult, type ImageGenParams, type ImageGenResult } from './types';

export const openaiHttp = axios.create({ baseURL: 'https://api.openai.com/v1' });

function auth() {
  return { Authorization: `Bearer ${env().OPENAI_API_KEY}` };
}

function dataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/** JSON-mode chat, optionally with images. The answer is parsed here and validated by the caller. */
export async function chatJson(p: ChatJsonParams): Promise<ChatJsonResult> {
  const content: unknown[] = [{ type: 'text', text: p.user }];
  for (const image of p.images ?? []) {
    content.push({ type: 'image_url', image_url: { url: dataUrl(image.buffer, image.mimeType), detail: p.imageDetail ?? 'low' } });
  }
  let data: {
    model?: string;
    choices?: { message?: { content?: string; refusal?: string | null }; finish_reason?: string }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } };
  };
  try {
    const res = await openaiHttp.post(
      '/chat/completions',
      {
        model: p.model,
        temperature: p.temperature ?? 0.3,
        max_tokens: p.maxTokens ?? 1500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: p.system },
          { role: 'user', content },
        ],
      },
      { headers: auth(), timeout: p.timeoutMs ?? 60_000 }
    );
    data = res.data;
  } catch (error) {
    throw mapAxiosError(error, 'OpenAI');
  }
  const choice = data.choices?.[0];
  if (choice?.message?.refusal) throw new ProviderRefusal(p.model, 'The model declined to answer.');
  const text = choice?.message?.content;
  if (!text) throw new BadModelOutput('The model returned no content.');
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new BadModelOutput('The model did not return valid JSON.');
  }
  const usage = data.usage
    ? { input: data.usage.prompt_tokens ?? 0, cachedInput: data.usage.prompt_tokens_details?.cached_tokens ?? 0, output: data.usage.completion_tokens ?? 0 }
    : null;
  return { json, usage, model: data.model ?? p.model };
}

export async function embed(model: string, text: string): Promise<{ vector: number[]; tokens: number }> {
  try {
    const res = await openaiHttp.post('/embeddings', { model, input: text }, { headers: auth(), timeout: 30_000 });
    const vector = res.data?.data?.[0]?.embedding as number[] | undefined;
    if (!vector?.length) throw new BadModelOutput('The embedding response was empty.');
    return { vector, tokens: res.data?.usage?.total_tokens ?? 0 };
  } catch (error) {
    if (error instanceof BadModelOutput) throw error;
    throw mapAxiosError(error, 'OpenAI');
  }
}

/**
 * /images/edits takes several images and one prompt, so the images are numbered in the prompt
 * itself, in the order they are attached.
 */
export function openaiPrompt(p: Pick<ImageGenParams, 'prompt' | 'images' | 'labels'>): string {
  const labels = p.images.map((_, i) => p.labels?.[i]).filter((l): l is string => !!l);
  if (!labels.length || labels.length !== p.images.length) return p.prompt;
  const list = labels.map((label, i) => `Image ${i + 1}: ${label.replace(/:\s*$/, '')}.`).join('\n');
  return `The attached images, in order:\n${list}\n\n${p.prompt}`;
}

/**
 * Square sizes for gpt-image-2, which takes any WIDTHxHEIGHT with edges in multiples of 16, at
 * most 3840 per edge and 8,294,400 pixels in all: 2880x2880 is the largest square it allows.
 */
export const OPENAI_SQUARE: Record<'1K' | '2K' | '4K', string> = { '1K': '1024x1024', '2K': '2048x2048', '4K': '2880x2880' };

/**
 * gpt-image-2. With images it goes through /images/edits, the endpoint that accepts them (style
 * references for a preview; the approved preview plus references for a final); with none, through
 * /images/generations. Always square. input_fidelity is left out: gpt-image-2 does not allow it.
 */
export async function imageEdit(p: ImageGenParams): Promise<ImageGenResult> {
  const prompt = openaiPrompt(p);
  const quality = p.quality ?? 'high';
  const size = OPENAI_SQUARE[p.imageSize ?? '1K'];
  let body: FormData | Record<string, unknown>;
  if (p.images.length) {
    const form = new FormData();
    form.append('model', p.model);
    form.append('prompt', prompt);
    form.append('size', size);
    form.append('quality', quality);
    form.append('n', '1');
    p.images.forEach((image, i) => {
      form.append('image[]', new Blob([new Uint8Array(image.buffer)], { type: image.mimeType }), `image-${i}.${image.mimeType.split('/')[1] ?? 'png'}`);
    });
    body = form;
  } else {
    body = { model: p.model, prompt, size, quality, n: 1 };
  }
  let data: { data?: { b64_json?: string }[]; usage?: { input_tokens_details?: { text_tokens?: number; image_tokens?: number }; output_tokens?: number } };
  try {
    const res = await openaiHttp.post(p.images.length ? '/images/edits' : '/images/generations', body, { headers: auth(), timeout: p.timeoutMs ?? 180_000 });
    data = res.data;
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const code = axios.isAxiosError(error) ? (error.response?.data as { error?: { code?: string } } | undefined)?.error?.code : undefined;
    if (status === 400 && code === 'moderation_blocked') throw new ProviderRefusal(p.model, 'The image model declined this request.');
    throw mapAxiosError(error, 'OpenAI');
  }
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new BadModelOutput('The image model returned no image.');
  return {
    image: { buffer: Buffer.from(b64, 'base64'), mimeType: 'image/png' },
    model: p.model,
    usage: data.usage
      ? { textInput: data.usage.input_tokens_details?.text_tokens, imageInput: data.usage.input_tokens_details?.image_tokens, output: data.usage.output_tokens }
      : null,
  };
}
