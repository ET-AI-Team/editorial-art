/**
 * Test environment: fake providers, the local test database and Redis, quiet logs. Set before any
 * module reads its configuration.
 */
const user = process.env.USER ?? 'postgres';

const defaults: Record<string, string> = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  DATABASE_URL: process.env.TEST_DATABASE_URL ?? `postgresql://${user}@localhost:5432/editorial_art_test`,
  REDIS_URL: process.env.TEST_REDIS_URL ?? 'redis://127.0.0.1:6379',
  EA_QUEUE_PREFIX: `eat${process.pid % 100000}`,
  EA_INTERNAL_API_KEYS: 'test-key-one,test-key-two',
  EA_API_KEY_REQUIRED: 'true',
  EA_FAKE_PROVIDERS: 'true',
  EA_READ_MODEL: 'gpt-4.1',
  EA_TEXT_MODEL: 'gpt-4.1',
  EA_JUDGE_MODEL: 'gpt-4.1',
  EA_EMBED_MODEL: 'text-embedding-3-small',
  EA_PREVIEW_MODEL: 'gemini-3.1-flash-image',
  EA_PREVIEW_FALLBACK_MODEL: 'gemini-3-pro-image',
  EA_FINAL_MODEL: 'gemini-3-pro-image',
  EA_FINAL_FALLBACK_MODEL: 'gpt-image-2',
  EA_EXTEND_MODEL: 'gemini-3-pro-image',
};

for (const [key, value] of Object.entries(defaults)) {
  process.env[key] ??= value;
}
