/**
 * What each model call costs, from the tokens it actually used. Rates are USD per million tokens,
 * from the providers' published pricing, converted at a fixed rate. Same table and method as
 * design-pipeline (apps/api/src/lib/pricing.ts), extended with this service's models.
 *
 * An unknown model is billed at the most expensive known rate of its kind, and missing usage
 * falls back to typical usage, so spend is never under-reported.
 */

export const USD_TO_INR = 88;
const PER_TOKEN = 1 / 1_000_000;

interface ChatRates {
  input: number;
  cachedInput: number;
  output: number;
}
interface OpenAiImageRates {
  textInput: number;
  imageInput: number;
  output: number;
}
interface GeminiImageRates {
  input: number;
  textOutput: number;
  imageOutput: number;
}

export const CHAT_PRICES: Record<string, ChatRates> = {
  'gpt-4.1': { input: 2.0, cachedInput: 0.5, output: 8.0 },
  'gpt-4.1-mini': { input: 0.4, cachedInput: 0.1, output: 1.6 },
};
export const EMBEDDING_PRICES: Record<string, number> = {
  'text-embedding-3-small': 0.02,
  'text-embedding-3-large': 0.13,
};
export const OPENAI_IMAGE_PRICES: Record<string, OpenAiImageRates> = {
  'gpt-image-2': { textInput: 5.0, imageInput: 8.0, output: 30.0 },
};
export const GEMINI_IMAGE_PRICES: Record<string, GeminiImageRates> = {
  'gemini-3-pro-image': { input: 2.0, textOutput: 12.0, imageOutput: 120.0 },
  'gemini-3.1-flash-image': { input: 0.5, textOutput: 3.0, imageOutput: 60.0 },
};

/** Typical usage when a response carries none (one 1K to 2K Gemini image is 1,120 tokens). */
export const TYPICAL = {
  chat: { input: 3_000, output: 800 },
  geminiImage: { input: 2_000, imageOutput: 1_120 },
  openaiImage: { textInput: 600, imageInput: 1_500, output: 6_000 },
};

/** Model ids come back dated or with a suffix; match the longest known prefix. */
function ratesFor<T>(table: Record<string, T>, model: string): T | undefined {
  const key = Object.keys(table)
    .filter((k) => model === k || model.startsWith(`${k}-`))
    .sort((a, b) => b.length - a.length)[0];
  return key ? table[key] : undefined;
}

function mostExpensive<T>(table: Record<string, T>, by: (t: T) => number): T {
  return Object.values(table).sort((a, b) => by(b) - by(a))[0]!;
}

const inr = (usd: number) => Math.round(usd * USD_TO_INR * 10_000) / 10_000;

export function chatCost(model: string, usage: { input?: number; cachedInput?: number; output?: number } | null): number {
  const r = ratesFor(CHAT_PRICES, model) ?? mostExpensive(CHAT_PRICES, (t) => t.output);
  const input = usage?.input ?? TYPICAL.chat.input;
  const cached = Math.min(usage?.cachedInput ?? 0, input);
  const output = usage?.output ?? TYPICAL.chat.output;
  return inr(((input - cached) * r.input + cached * r.cachedInput + output * r.output) * PER_TOKEN);
}

export function embeddingCost(model: string, tokens: number): number {
  const r = ratesFor(EMBEDDING_PRICES, model) ?? mostExpensive(EMBEDDING_PRICES, (t) => t);
  return inr(tokens * r * PER_TOKEN);
}

export function geminiImageCost(model: string, usage: { input?: number; textOutput?: number; imageOutput?: number } | null): number {
  const r = ratesFor(GEMINI_IMAGE_PRICES, model) ?? mostExpensive(GEMINI_IMAGE_PRICES, (t) => t.imageOutput);
  const input = usage?.input ?? TYPICAL.geminiImage.input;
  const imageOutput = usage?.imageOutput ?? TYPICAL.geminiImage.imageOutput;
  const textOutput = usage?.textOutput ?? 0;
  return inr((input * r.input + textOutput * r.textOutput + imageOutput * r.imageOutput) * PER_TOKEN);
}

export function openaiImageCost(model: string, usage: { textInput?: number; imageInput?: number; output?: number } | null): number {
  const r = ratesFor(OPENAI_IMAGE_PRICES, model) ?? mostExpensive(OPENAI_IMAGE_PRICES, (t) => t.output);
  const u = { ...TYPICAL.openaiImage, ...(usage ?? {}) };
  return inr((u.textInput * r.textInput + u.imageInput * r.imageInput + u.output * r.output) * PER_TOKEN);
}

/** Pre-call estimates the spend guard checks against. Deliberately on the high side. */
export const ESTIMATE_INR = {
  read: 2,
  /** gpt-4.1-mini over at most 4,000 characters: well under 0.1 in practice. */
  photoAdvice: 0.1,
  text: 0.5,
  previewTextCheck: 0.2,
  judge: 1.5,
  embed: 0.01,
  previewImage: 8,
  finalImage: 15,
  openaiFinal: 18,
} as const;
