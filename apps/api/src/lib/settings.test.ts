import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { resetDb } from '../../test/db';
import { db } from './db';
import { resetEnvForTests } from './env';
import { imageEstimateInr, openaiImageCost } from './pricing';
import { crossProviderFallback, defaultImageModels, imageModels, providerOf, resetSettingsCacheForTests, setImageModels } from './settings';

beforeEach(async () => {
  await resetDb();
  resetSettingsCacheForTests();
});

afterAll(async () => {
  process.env.EA_PREVIEW_MODEL = 'gemini-3.1-flash-image';
  resetEnvForTests();
  resetSettingsCacheForTests();
  await db.$disconnect();
});

describe('image model setting', () => {
  test('defaults come from EA_PREVIEW_MODEL and EA_FINAL_MODEL', async () => {
    expect(await imageModels()).toEqual({ previewModel: 'gemini-3.1-flash-image', finalModel: 'gemini-3-pro-image', finalImageSize: '2K' });
  });

  test('an env model admins cannot pick falls back to the built-in default', () => {
    process.env.EA_PREVIEW_MODEL = 'some-other-model';
    resetEnvForTests();
    expect(defaultImageModels().previewModel).toBe('gemini-3.1-flash-image');
    process.env.EA_PREVIEW_MODEL = 'gemini-3.1-flash-image';
    resetEnvForTests();
  });

  test('a saved choice persists, and a partial change keeps the other model', async () => {
    await setImageModels({ previewModel: 'gpt-image-2' }, 'admin-1');
    resetSettingsCacheForTests();
    expect(await imageModels()).toEqual({ previewModel: 'gpt-image-2', finalModel: 'gemini-3-pro-image', finalImageSize: '2K' });
    await setImageModels({ finalModel: 'gpt-image-2', finalImageSize: '4K' }, 'admin-1');
    expect(await imageModels()).toEqual({ previewModel: 'gpt-image-2', finalModel: 'gpt-image-2', finalImageSize: '4K' });
    const row = await db.setting.findUniqueOrThrow({ where: { key: 'image-models' } });
    expect(row.updatedBy).toBe('admin-1');
  });

  test('it is cached for a while, so a change made elsewhere shows up after the cache expires', async () => {
    expect((await imageModels()).previewModel).toBe('gemini-3.1-flash-image');
    await db.setting.create({ data: { key: 'image-models', value: { previewModel: 'gemini-3-pro-image', finalModel: 'gemini-3-pro-image' } } });
    expect((await imageModels()).previewModel).toBe('gemini-3.1-flash-image');
    resetSettingsCacheForTests();
    expect((await imageModels()).previewModel).toBe('gemini-3-pro-image');
  });

  test('a stored value that is no longer valid falls back to the defaults', async () => {
    await db.setting.create({ data: { key: 'image-models', value: { previewModel: 'retired-model' } } });
    expect(await imageModels()).toEqual(defaultImageModels());
  });

  test('every model maps to its provider, and the fallback is always the other provider', () => {
    expect(providerOf('gemini-3.1-flash-image')).toBe('gemini');
    expect(providerOf('gemini-3-pro-image')).toBe('gemini');
    expect(providerOf('gpt-image-2')).toBe('openai');
    expect(crossProviderFallback('gemini-3.1-flash-image')).toBe('gpt-image-2');
    expect(crossProviderFallback('gemini-3-pro-image')).toBe('gpt-image-2');
    expect(crossProviderFallback('gpt-image-2')).toBe('gemini-3-pro-image');
  });

  test('spend estimates cover every model and size, grow with size, and stay above the published price', () => {
    for (const model of ['gemini-3.1-flash-image', 'gemini-3-pro-image', 'gpt-image-2']) {
      expect(imageEstimateInr(model, '1K')).toBeLessThanOrEqual(imageEstimateInr(model, '2K'));
      expect(imageEstimateInr(model, '2K')).toBeLessThan(imageEstimateInr(model, '4K'));
    }
    // Published: flash 2K $0.101, pro 2K $0.134, pro 4K $0.24, at Rs 88 to the dollar.
    expect(imageEstimateInr('gemini-3.1-flash-image', '2K')).toBeGreaterThan(0.101 * 88);
    expect(imageEstimateInr('gemini-3-pro-image', '2K')).toBeGreaterThan(0.134 * 88);
    expect(imageEstimateInr('gemini-3-pro-image', '4K')).toBeGreaterThan(0.24 * 88);
    // gpt-image-2 high at 1024 is $0.211 of output alone.
    expect(imageEstimateInr('gpt-image-2', '1K')).toBeGreaterThan(0.211 * 88);
    const cost = openaiImageCost('gpt-image-2', { textInput: 600, imageInput: 4500, output: 7000 });
    expect(cost).toBeLessThan(imageEstimateInr('gpt-image-2', '1K'));
  });
});
