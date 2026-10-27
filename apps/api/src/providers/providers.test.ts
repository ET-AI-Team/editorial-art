import { afterEach, describe, expect, mock, test } from 'bun:test';
import axios from 'axios';
import { boundedUrl } from './cloudinary.client';
import { geminiHttp, geminiParts, generateImage } from './gemini.client';
import { chatJson, imageEdit, openaiHttp, openaiPrompt } from './openai.client';
import { BadModelOutput, ProviderRefusal, ProviderUnavailable } from './types';

const originals = { gemini: geminiHttp.post, openai: openaiHttp.post };
afterEach(() => {
  geminiHttp.post = originals.gemini;
  openaiHttp.post = originals.openai;
});

function respond(data: unknown) {
  geminiHttp.post = mock(async () => ({ data })) as typeof geminiHttp.post;
  openaiHttp.post = mock(async () => ({ data })) as typeof openaiHttp.post;
}

const imageCall = { model: 'gemini-3.1-flash-image', prompt: 'p', images: [], aspectRatio: '1:1' as const };

describe('Gemini image client', () => {
  test('returns the inline image and usage', async () => {
    respond({
      candidates: [{ finishReason: 'STOP', content: { parts: [{ inlineData: { mimeType: 'image/png', data: Buffer.from('png').toString('base64') } }] } }],
      usageMetadata: { promptTokenCount: 1800, candidatesTokenCount: 1120, candidatesTokensDetails: [{ modality: 'IMAGE', tokenCount: 1120 }] },
    });
    const result = await generateImage(imageCall);
    expect(result.image.buffer.toString()).toBe('png');
    expect(result.usage).toEqual({ input: 1800, imageOutput: 1120, textOutput: 0 });
  });

  test('a safety finish reason, a blocked prompt or a text-only answer is a refusal', async () => {
    respond({ candidates: [{ finishReason: 'IMAGE_SAFETY', content: { parts: [] } }] });
    await expect(generateImage(imageCall)).rejects.toBeInstanceOf(ProviderRefusal);
    respond({ promptFeedback: { blockReason: 'SAFETY' } });
    await expect(generateImage(imageCall)).rejects.toBeInstanceOf(ProviderRefusal);
    respond({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'I cannot draw that.' }] } }] });
    await expect(generateImage(imageCall)).rejects.toBeInstanceOf(ProviderRefusal);
  });

  test('an empty answer is bad output, and an HTTP error is unavailable without provider text', async () => {
    respond({ candidates: [{ finishReason: 'STOP', content: { parts: [] } }] });
    await expect(generateImage(imageCall)).rejects.toBeInstanceOf(BadModelOutput);
    geminiHttp.post = mock(async () => {
      throw Object.assign(new axios.AxiosError('boom'), { response: { status: 503, data: { error: { message: 'internal secret detail' } } } });
    }) as typeof geminiHttp.post;
    const error = await generateImage(imageCall).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderUnavailable);
    expect(String((error as Error).message)).not.toContain('secret');
  });
});

describe('OpenAI chat client', () => {
  const params = { kind: 'read' as const, model: 'gpt-4.1', system: 's', user: 'u' };

  test('parses JSON and reports usage including cached tokens', async () => {
    respond({ model: 'gpt-4.1-2025-04-14', choices: [{ message: { content: '{"a":1}' } }], usage: { prompt_tokens: 100, completion_tokens: 20, prompt_tokens_details: { cached_tokens: 40 } } });
    const result = await chatJson(params);
    expect(result.json).toEqual({ a: 1 });
    expect(result.usage).toEqual({ input: 100, cachedInput: 40, output: 20 });
    expect(result.model).toBe('gpt-4.1-2025-04-14');
  });

  test('invalid JSON is bad output; a refusal is a refusal', async () => {
    respond({ choices: [{ message: { content: 'not json' } }] });
    await expect(chatJson(params)).rejects.toBeInstanceOf(BadModelOutput);
    respond({ choices: [{ message: { content: null, refusal: 'no' } }] });
    await expect(chatJson(params)).rejects.toBeInstanceOf(ProviderRefusal);
  });
});

describe('labelled reference images', () => {
  const img = (s: string) => ({ buffer: Buffer.from(s), mimeType: 'image/webp' });
  const labelled = { prompt: 'PROMPT', images: [img('a'), img('b')], labels: ['Style reference 1 of 2:', 'Style reference 2 of 2:'] };

  test('Gemini is asked for the output size in imageConfig.imageSize', async () => {
    let sent: { generationConfig?: { imageConfig?: unknown } } = {};
    geminiHttp.post = mock(async (_path: string, body: typeof sent) => {
      sent = body;
      return { data: { candidates: [{ finishReason: 'STOP', content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'cG5n' } }] } }] } };
    }) as unknown as typeof geminiHttp.post;
    await generateImage({ ...imageCall, imageSize: '2K' });
    expect(sent.generationConfig?.imageConfig).toEqual({ aspectRatio: '1:1', imageSize: '2K' });
    await generateImage(imageCall);
    expect(sent.generationConfig?.imageConfig).toEqual({ aspectRatio: '1:1' });
  });

  test('Gemini gets the prompt, then each image right after its own label', () => {
    const parts = geminiParts(labelled) as { text?: string; inlineData?: { data: string } }[];
    expect(parts.map((p) => p.text ?? `image:${Buffer.from(p.inlineData!.data, 'base64').toString()}`)).toEqual([
      'PROMPT',
      'Style reference 1 of 2:',
      'image:a',
      'Style reference 2 of 2:',
      'image:b',
    ]);
    expect(geminiParts({ prompt: 'P', images: [img('a')] })).toHaveLength(2);
  });

  test('OpenAI gets the images numbered at the top of its one prompt', () => {
    expect(openaiPrompt(labelled)).toBe('The attached images, in order:\nImage 1: Style reference 1 of 2.\nImage 2: Style reference 2 of 2.\n\nPROMPT');
    expect(openaiPrompt({ prompt: 'P', images: [img('a')] })).toBe('P');
  });

  test('gpt-image-2 sends every image to /images/edits at the asked quality, and uses /images/generations with none', async () => {
    const seen: { path: string; body: unknown }[] = [];
    openaiHttp.post = mock(async (path: string, body: unknown) => {
      seen.push({ path, body });
      return { data: { data: [{ b64_json: Buffer.from('png').toString('base64') }], usage: { input_tokens_details: { text_tokens: 500, image_tokens: 3000 }, output_tokens: 1100 } } };
    }) as unknown as typeof openaiHttp.post;
    const r = await imageEdit({ model: 'gpt-image-2', aspectRatio: '1:1', quality: 'high', imageSize: '2K', ...labelled });
    expect(r.usage).toEqual({ textInput: 500, imageInput: 3000, output: 1100 });
    const form = seen[0]!.body as FormData;
    expect(seen[0]!.path).toBe('/images/edits');
    expect(form.getAll('image[]')).toHaveLength(2);
    expect(form.get('quality')).toBe('high');
    expect(form.get('size')).toBe('2048x2048');
    expect(String(form.get('prompt'))).toStartWith('The attached images, in order:');
    await imageEdit({ model: 'gpt-image-2', aspectRatio: '1:1', prompt: 'P', images: [], imageSize: '4K' });
    expect(seen[1]!.path).toBe('/images/generations');
    expect(seen[1]!.body).toEqual({ model: 'gpt-image-2', prompt: 'P', size: '2880x2880', quality: 'high', n: 1 });
  });
});

describe('Cloudinary delivery URLs', () => {
  test('inserts a bounding transform once', () => {
    const url = 'https://res.cloudinary.com/acme/image/upload/v123/editorial-art/x.png';
    expect(boundedUrl(url, 1024)).toBe('https://res.cloudinary.com/acme/image/upload/w_1024,c_limit,q_auto:best/v123/editorial-art/x.png');
    expect(boundedUrl(boundedUrl(url, 1024), 512)).toBe(boundedUrl(url, 1024));
    expect(boundedUrl('https://example.com/x.png', 1024)).toBe('https://example.com/x.png');
  });
});
