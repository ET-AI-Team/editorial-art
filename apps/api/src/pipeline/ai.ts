import type { ZodTypeAny, z } from 'zod';
import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { chatCost, embeddingCost, ESTIMATE_INR, geminiImageCost, openaiImageCost } from '../lib/pricing';
import { assertCanSpend, recordAttempt } from '../lib/spend-guard';
import { errorSummary } from '../providers/http';
import { BadModelOutput, ProviderRefusal, ProviderTimeout, providers, type ChatJsonParams, type ImageData, type ImageGenResult, type AspectRatio } from '../providers';

/**
 * Every paid model call goes through here: the spend guard before, an Attempt row with the real
 * cost after (success or not), and schema validation of structured answers.
 */

export interface CallContext {
  stage: string;
  requestId?: string | null;
  optionId?: string | null;
}

function providerName(kind: 'chat' | 'embed' | 'gemini' | 'openai'): 'openai' | 'google' | 'fake' {
  if (env().EA_FAKE_PROVIDERS) return 'fake';
  return kind === 'gemini' ? 'google' : 'openai';
}

function resultOf(error: unknown): 'REFUSED' | 'TIMEOUT' | 'ERROR' {
  if (error instanceof ProviderRefusal) return 'REFUSED';
  if (error instanceof ProviderTimeout) return 'TIMEOUT';
  return 'ERROR';
}

function codeOf(error: unknown): string {
  return (error as { code?: string }).code ?? 'ERROR';
}

export async function chat<S extends ZodTypeAny>(
  ctx: CallContext,
  params: ChatJsonParams,
  schema: S,
  estimateInr: number = ESTIMATE_INR.text
): Promise<z.infer<S>> {
  await assertCanSpend(estimateInr, ctx.requestId);
  const startedAt = new Date();
  let answer;
  try {
    answer = await providers().chatJson(params);
  } catch (error) {
    await recordAttempt({ ...ctx, provider: providerName('chat'), model: params.model, result: resultOf(error), errorCode: codeOf(error), costInr: 0, startedAt, completedAt: new Date() });
    logger.warn({ stage: ctx.stage, eaRequestId: ctx.requestId, optionId: ctx.optionId, model: params.model, err: errorSummary(error) }, 'provider_error');
    throw error;
  }
  const parsed = schema.safeParse(answer.json);
  const costInr = chatCost(answer.model, answer.usage);
  await recordAttempt({
    ...ctx,
    provider: providerName('chat'),
    model: answer.model,
    result: parsed.success ? 'OK' : 'ERROR',
    errorCode: parsed.success ? null : 'BAD_MODEL_OUTPUT',
    inputTokens: answer.usage?.input ?? 0,
    outputTokens: answer.usage?.output ?? 0,
    costInr,
    startedAt,
    completedAt: new Date(),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new BadModelOutput(`The model's answer did not match the expected shape (${first?.path.join('.') || 'root'}: ${first?.message ?? 'invalid'}).`);
  }
  return parsed.data;
}

export async function embedText(ctx: CallContext, text: string): Promise<number[]> {
  const model = env().EA_EMBED_MODEL;
  await assertCanSpend(ESTIMATE_INR.embed, ctx.requestId);
  const startedAt = new Date();
  try {
    const { vector, tokens } = await providers().embed(model, text);
    await recordAttempt({ ...ctx, provider: providerName('embed'), model, result: 'OK', inputTokens: tokens, costInr: embeddingCost(model, tokens), startedAt, completedAt: new Date() });
    return vector;
  } catch (error) {
    await recordAttempt({ ...ctx, provider: providerName('embed'), model, result: resultOf(error), errorCode: codeOf(error), costInr: 0, startedAt, completedAt: new Date() });
    throw error;
  }
}

export interface ImageCall {
  provider: 'gemini' | 'openai';
  model: string;
  prompt: string;
  images: ImageData[];
  aspectRatio: AspectRatio;
  timeoutMs?: number;
}

export async function generateImage(ctx: CallContext, call: ImageCall, estimateInr: number): Promise<ImageGenResult> {
  await assertCanSpend(estimateInr, ctx.requestId);
  const startedAt = new Date();
  const p = providers();
  try {
    const result = call.provider === 'gemini' ? await p.geminiImage(call) : await p.openaiImageEdit(call);
    const costInr = call.provider === 'gemini' ? geminiImageCost(result.model, result.usage) : openaiImageCost(result.model, result.usage);
    await recordAttempt({
      ...ctx,
      provider: providerName(call.provider),
      model: result.model,
      result: 'OK',
      inputTokens: result.usage?.input ?? (result.usage?.textInput ?? 0) + (result.usage?.imageInput ?? 0),
      imageTokens: result.usage?.imageOutput ?? result.usage?.output ?? 0,
      costInr,
      startedAt,
      completedAt: new Date(),
    });
    return result;
  } catch (error) {
    await recordAttempt({ ...ctx, provider: providerName(call.provider), model: call.model, result: resultOf(error), errorCode: codeOf(error), costInr: 0, startedAt, completedAt: new Date() });
    logger.warn({ stage: ctx.stage, eaRequestId: ctx.requestId, optionId: ctx.optionId, model: call.model, err: errorSummary(error) }, error instanceof ProviderRefusal ? 'provider_refused' : 'provider_error');
    throw error;
  }
}

/** Tests only: throws inside a worker after the named stage, to simulate a crash there. */
export function maybeCrash(stage: string): void {
  if (env().EA_TEST_CRASH_AT === stage) throw new Error(`simulated crash after ${stage}`);
}
