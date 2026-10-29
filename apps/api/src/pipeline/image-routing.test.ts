import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { resetDb } from '../../test/db';
import { db } from '../lib/db';
import { ProviderRefusal, setProviders } from '../providers';
import { createFakeProviders } from '../providers/fake/fake-providers';
import { routedImage, type ImageRequest } from './image-routing';

let fake: ReturnType<typeof createFakeProviders>;

beforeEach(async () => {
  await resetDb();
  fake = createFakeProviders();
  setProviders(fake);
});

afterAll(async () => {
  setProviders(undefined);
  await db.$disconnect();
});

const png = { buffer: Buffer.from('x'), mimeType: 'image/png' };

function request(model: string, prompt = 'a scene', stage: 'preview' | 'final' = 'preview'): ImageRequest {
  return {
    stage,
    model,
    imageSize: '2K',
    prompt,
    images: [png, png, png],
    sources: [1, 2, 3].map((i) => ({ role: 'reference' as const, url: `https://res.cloudinary.com/fake/image/upload/v1/r${i}.webp` })),
    likenessNames: [],
  };
}

const ctx = { stage: 'preview' };

describe('image routing', () => {
  test('a Gemini model goes to Gemini with every image labelled', async () => {
    const r = await routedImage(ctx, request('gemini-3.1-flash-image'));
    expect(r.model).toBe('gemini-3.1-flash-image');
    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0]).toMatchObject({ kind: 'image:gemini', imageCount: 3, labels: ['Style reference 1 of 3:', 'Style reference 2 of 3:', 'Style reference 3 of 3:'] });
    expect(r.sent.images.map((i) => i.label)).toEqual(['Style reference 1 of 3:', 'Style reference 2 of 3:', 'Style reference 3 of 3:']);
    expect(r.sent.prompt).toBe('a scene');
  });

  test('gpt-image-2 goes to OpenAI with its references, at high quality and the asked size for previews and finals', async () => {
    await routedImage(ctx, request('gpt-image-2'));
    await routedImage({ stage: 'finalize' }, request('gpt-image-2', 'a scene', 'final'));
    expect(fake.calls.map((c) => [c.kind, c.model, c.quality, c.imageSize, c.imageCount])).toEqual([
      ['image:openai', 'gpt-image-2', 'high', '2K', 3],
      ['image:openai', 'gpt-image-2', 'high', '2K', 3],
    ]);
    const attempts = await db.attempt.findMany({ orderBy: { startedAt: 'asc' } });
    expect(attempts.map((a) => a.model)).toEqual(['gpt-image-2', 'gpt-image-2']);
    expect(attempts.every((a) => Number(a.costInr) > 0)).toBe(true);
  });

  test('when Gemini is down, flash tries pro and then OpenAI; when OpenAI is down, one Gemini model', async () => {
    const a = await routedImage(ctx, request('gemini-3.1-flash-image', 'FAKE_GEMINI_DOWN'));
    expect(a.model).toBe('gpt-image-2');
    expect(a.sent.model).toBe('gpt-image-2');
    const b = await routedImage(ctx, request('gpt-image-2', 'FAKE_OPENAI_DOWN'));
    expect(b.model).toBe('gemini-3-pro-image');
    expect(fake.calls.map((c) => `${c.kind}:${c.model}`)).toEqual([
      'image:gemini:gemini-3.1-flash-image',
      'image:gemini:gemini-3-pro-image',
      'image:openai:gpt-image-2',
      'image:openai:gpt-image-2',
      'image:gemini:gemini-3-pro-image',
    ]);
  });

  test('a refusal falls back to the other provider; refusals from every model are a refusal', async () => {
    const r = await routedImage(ctx, request('gemini-3-pro-image', 'FAKE_REFUSE_PRIMARY'));
    expect(r.model).toBe('gpt-image-2');
    await expect(routedImage(ctx, request('gemini-3-pro-image', 'FAKE_REFUSE'))).rejects.toBeInstanceOf(ProviderRefusal);
  });

  test('flash that fails falls back to pro before switching provider', async () => {
    const { imageModelChain } = await import('../lib/settings');
    expect(imageModelChain('gemini-3.1-flash-image')).toEqual(['gemini-3.1-flash-image', 'gemini-3-pro-image', 'gpt-image-2']);
    expect(imageModelChain('gemini-3-pro-image')).toEqual(['gemini-3-pro-image', 'gpt-image-2']);
    expect(imageModelChain('gpt-image-2')).toEqual(['gpt-image-2', 'gemini-3-pro-image']);
  });
});
