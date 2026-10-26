import { z } from 'zod';

/**
 * Every setting the service reads, parsed once at startup. A missing or malformed required value
 * stops the process with the variable's name (never its value).
 *
 * Model names have no defaults on purpose: a guessed model string must never ship silently.
 */

const bool = (fallback: boolean) =>
  z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? fallback : v === 'true'));
const int = (fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER) => z.coerce.number().int().min(min).max(max).default(fallback);
const inr = (fallback: number) => z.coerce.number().min(0).default(fallback);

const Schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

    EA_HOST: z.string().default('127.0.0.1'),
    EA_PORT: int(7202, 1, 65535),
    EA_ROLE: z.enum(['all', 'api', 'worker']).default('all'),
    EA_WORKER_HEALTH_PORT: int(7203, 1, 65535),

    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1).default('redis://127.0.0.1:6379'),
    EA_QUEUE_PREFIX: z.string().regex(/^[a-z][a-z0-9-]{0,19}$/).default('ea'),

    EA_INTERNAL_API_KEYS: z.string().min(1),
    EA_API_KEY_REQUIRED: bool(true),

    EA_FAKE_PROVIDERS: bool(false),
    OPENAI_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    EA_CLOUDINARY_FOLDER: z.string().default('editorial-art'),

    EA_READ_MODEL: z.string().min(1),
    EA_TEXT_MODEL: z.string().min(1),
    EA_JUDGE_MODEL: z.string().min(1),
    EA_EMBED_MODEL: z.string().min(1),
    EA_PREVIEW_MODEL: z.string().min(1),
    EA_PREVIEW_FALLBACK_MODEL: z.string().min(1),
    EA_FINAL_MODEL: z.string().min(1),
    EA_FINAL_FALLBACK_MODEL: z.string().min(1),

    EA_READ_CONCURRENCY: int(6, 1, 64),
    EA_PREVIEW_CONCURRENCY: int(8, 1, 64),
    EA_FINALIZE_CONCURRENCY: int(4, 1, 64),
    EA_PACK_CONCURRENCY: int(4, 1, 64),
    EA_LIBRARY_CONCURRENCY: int(4, 1, 64),

    EA_REQUEST_SPEND_CAP_INR: inr(200),
    EA_DAILY_SPEND_CAP_INR: z.coerce.number().min(0).optional(),
    EA_BUILD_SPEND_CAP_INR: z.coerce.number().min(0).optional(),

    EA_RATE_CREATE_PER_HOUR: int(30, 1),
    EA_RATE_BATCH_PER_HOUR: int(60, 1),
    EA_RATE_FINALIZE_PER_HOUR: int(40, 1),
    EA_RATE_WORKSPACE_WRITES_PER_HOUR: int(200, 1),
    EA_RATE_LIBRARY_PER_HOUR: int(10, 1),
    EA_USER_CONCURRENT_REQUESTS: int(3, 1, 50),

    EA_MAX_BATCHES_PER_REQUEST: int(8, 1, 50),
    EA_ARTICLE_RETENTION_DAYS: int(90, 1),
    EA_PREVIEW_RETENTION_DAYS: int(180, 1),
    EA_CREDIT_LINE: z.string().min(1).max(80).default('AI illustration: ET'),

    EA_TEST_CRASH_AT: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.EA_FAKE_PROVIDERS) {
      for (const key of ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'] as const) {
        if (!v[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'required unless EA_FAKE_PROVIDERS=true' });
      }
    }
    if (v.NODE_ENV === 'production' && v.EA_TEST_CRASH_AT) {
      ctx.addIssue({ code: 'custom', path: ['EA_TEST_CRASH_AT'], message: 'must not be set in production' });
    }
    if (v.NODE_ENV === 'production' && v.EA_FAKE_PROVIDERS) {
      ctx.addIssue({ code: 'custom', path: ['EA_FAKE_PROVIDERS'], message: 'must not be true in production' });
    }
  });

export type Env = z.infer<typeof Schema>;

/** Parses a given environment. Exported for tests; the app uses `env` below. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = Schema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new Error(`Invalid configuration:\n  ${problems.join('\n  ')}`);
  }
  return result.data;
}

let cached: Env | undefined;

/** The validated configuration. Parsed on first use so tests can set process.env first. */
export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

/** Tests only: forget the cached configuration after changing process.env. */
export function resetEnvForTests(): void {
  cached = undefined;
}
