import { describe, expect, test } from 'bun:test';
import { chatCost, embeddingCost, geminiImageCost, openaiImageCost } from './pricing';

describe('pricing', () => {
  test('gpt-4.1 from token usage', () => {
    // (3000 x 2 + 1000 x 8) / 1M USD = 0.014 USD = Rs 1.232
    expect(chatCost('gpt-4.1', { input: 3000, output: 1000 })).toBeCloseTo(1.232, 4);
  });

  test('a flash image at 1,120 output tokens', () => {
    // (2000 x 0.5 + 1120 x 60) / 1M USD = 0.0682 USD = Rs 6.0016
    expect(geminiImageCost('gemini-3.1-flash-image', { input: 2000, imageOutput: 1120 })).toBeCloseTo(6.0016, 4);
  });

  test('dated model ids match their base price', () => {
    expect(chatCost('gpt-4.1-2025-04-14', { input: 3000, output: 1000 })).toBeCloseTo(1.232, 4);
  });

  test('an unknown model is billed at the most expensive rate, never less', () => {
    expect(geminiImageCost('gemini-9-ultra-image', { input: 2000, imageOutput: 1120 })).toBeGreaterThanOrEqual(
      geminiImageCost('gemini-3-pro-image', { input: 2000, imageOutput: 1120 })
    );
  });

  test('missing usage falls back to typical usage', () => {
    expect(geminiImageCost('gemini-3-pro-image', null)).toBeGreaterThan(10);
    expect(openaiImageCost('gpt-image-2', null)).toBeGreaterThan(10);
    expect(embeddingCost('text-embedding-3-small', 1000)).toBeCloseTo(0.0018, 4);
  });
});
