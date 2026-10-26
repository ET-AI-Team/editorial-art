import { afterEach, describe, expect, mock, test } from 'bun:test';
import axios from 'axios';
import { boundedUrl } from './cloudinary.client';
import { geminiHttp, generateImage } from './gemini.client';
import { chatJson, openaiHttp } from './openai.client';
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

describe('Cloudinary delivery URLs', () => {
  test('inserts a bounding transform once', () => {
    const url = 'https://res.cloudinary.com/acme/image/upload/v123/editorial-art/x.png';
    expect(boundedUrl(url, 1024)).toBe('https://res.cloudinary.com/acme/image/upload/w_1024,c_limit,q_auto:good/v123/editorial-art/x.png');
    expect(boundedUrl(boundedUrl(url, 1024), 512)).toBe(boundedUrl(url, 1024));
    expect(boundedUrl('https://example.com/x.png', 1024)).toBe('https://example.com/x.png');
  });
});
