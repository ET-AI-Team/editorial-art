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

/** gpt-image-2 edit: the first image is the one to recreate; the rest are style references. */
export async function imageEdit(p: ImageGenParams): Promise<ImageGenResult> {
  const form = new FormData();
  form.append('model', p.model);
  form.append('prompt', p.prompt);
  form.append('size', '1024x1024');
  form.append('quality', 'high');
  form.append('n', '1');
  p.images.forEach((image, i) => {
    form.append('image[]', new Blob([new Uint8Array(image.buffer)], { type: image.mimeType }), `image-${i}.${image.mimeType.split('/')[1] ?? 'png'}`);
  });
  let data: { data?: { b64_json?: string }[]; usage?: { input_tokens_details?: { text_tokens?: number; image_tokens?: number }; output_tokens?: number } };
  try {
    const res = await openaiHttp.post('/images/edits', form, { headers: auth(), timeout: p.timeoutMs ?? 180_000 });
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
