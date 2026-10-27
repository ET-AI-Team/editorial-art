import { describe, expect, test } from 'bun:test';
import { parseEnv } from './env';

const base = {
  DATABASE_URL: 'postgresql://x@localhost/db',
  EA_INTERNAL_API_KEYS: 'k',
  EA_FAKE_PROVIDERS: 'true',
  EA_READ_MODEL: 'gpt-4.1',
  EA_TEXT_MODEL: 'gpt-4.1',
  EA_JUDGE_MODEL: 'gpt-4.1',
  EA_EMBED_MODEL: 'text-embedding-3-small',
  EA_PREVIEW_MODEL: 'gemini-3.1-flash-image',
  EA_PREVIEW_FALLBACK_MODEL: 'gemini-3-pro-image',
  EA_FINAL_MODEL: 'gemini-3-pro-image',
  EA_FINAL_FALLBACK_MODEL: 'gpt-image-2',
};

describe('configuration', () => {
  test('defaults: loopback, key required, sensible caps', () => {
    const env = parseEnv(base);
    expect(env.EA_HOST).toBe('127.0.0.1');
    expect(env.EA_API_KEY_REQUIRED).toBe(true);
    expect(env.EA_DAILY_SPEND_CAP_INR).toBeUndefined();
    expect(env.EA_BUILD_SPEND_CAP_INR).toBeUndefined();
    expect(env.EA_ADVICE_MODEL).toBe('gpt-4.1-mini');
  });

  test('model names are required, with the variable named in the error', () => {
    const { EA_PREVIEW_MODEL: _drop, ...rest } = base;
    expect(() => parseEnv(rest)).toThrow(/EA_PREVIEW_MODEL/);
  });

  test('real providers need their keys', () => {
    expect(() => parseEnv({ ...base, EA_FAKE_PROVIDERS: 'false' })).toThrow(/OPENAI_API_KEY/);
  });

  test('test-only switches are refused in production', () => {
    expect(() => parseEnv({ ...base, NODE_ENV: 'production', EA_TEST_CRASH_AT: 'read' })).toThrow(/EA_TEST_CRASH_AT/);
    expect(() => parseEnv({ ...base, NODE_ENV: 'production' })).toThrow(/EA_FAKE_PROVIDERS/);
  });

  test('malformed numbers are refused', () => {
    expect(() => parseEnv({ ...base, EA_PORT: 'eighty' })).toThrow(/EA_PORT/);
  });

  test('error messages never include values', () => {
    try {
      parseEnv({ ...base, EA_FAKE_PROVIDERS: 'false', OPENAI_API_KEY: 'sk-secret-value' });
    } catch (error) {
      expect(String(error)).not.toContain('sk-secret-value');
    }
  });
});
