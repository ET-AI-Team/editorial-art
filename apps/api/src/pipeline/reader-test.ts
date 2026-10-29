import { ReaderTestOutput, type ReaderRewrite, type SensitivityLevel } from '@editorial-art/shared-types';
import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { ESTIMATE_INR } from '../lib/pricing';
import { escapeDelimited } from '../lib/text';
import { errorSummary } from '../providers/http';
import { chat, type CallContext } from './ai';
import { READER_TEST_SYSTEM_PROMPT } from './system-prompts';

/**
 * The reader test (after the read): a reader who has seen only the headline scores each direction
 * 1 to 10 for "connects this image to the story in two seconds". A direction under the bar is
 * rewritten once, in the same call, and the rewrites are scored again in a second call. A rewrite
 * replaces the idea only when it scores higher; its style, people and avoid list never change.
 *
 * Optional by design: any failure leaves the directions as they were, without scores.
 */

export const READER_PASS = 7;

/** The part of a direction the reader test sees and may rewrite. */
export interface ReaderDirection {
  rank: number;
  title: string;
  idea: string;
  mustShow: string[];
  whyItFits: string;
  avoid: string[];
  /** Names of real people the idea shows; a rewrite may not add anyone. */
  people: string[];
}

export interface ReaderTestInput {
  headline: string;
  claim: string;
  tone: string;
  level: SensitivityLevel;
  directions: ReaderDirection[];
}

export interface ReaderVerdict {
  rank: number;
  score: number;
  reason: string;
  /** The rewrite that replaced the idea, when one scored higher. */
  rewrite: ReaderRewrite | null;
}

function directionBlock(d: Pick<ReaderDirection, 'rank' | 'idea' | 'mustShow'>): string {
  const body = `idea: ${d.idea}\nmust show: ${d.mustShow.join('; ') || '(none listed)'}`;
  return `<direction rank="${d.rank}">\n${escapeDelimited(body, 'direction')}\n</direction>`;
}

function safetyLine(input: ReaderTestInput, d: ReaderDirection): string {
  const people = d.people.length ? `only these real people may appear: ${d.people.join(', ')}` : 'no real, named people';
  return `- rank ${d.rank}: ${people}; must not show: ${d.avoid.join(', ') || 'nothing listed'}`;
}

/** Scoring only, or scoring plus a rewrite of every direction under the bar. */
export function buildReaderTestUser(input: ReaderTestInput, opts: { rewrite: boolean }): string {
  const parts = [
    `HEADLINE: ${input.headline.replace(/\n/g, ' ')}`,
    `WHAT CHANGED: ${input.claim.replace(/\n/g, ' ')}`,
    `DIRECTIONS\n${input.directions.map(directionBlock).join('\n')}`,
  ];
  if (opts.rewrite) {
    const restrained = input.level === 'ELEVATED' || input.level === 'HIGH';
    parts.push(
      `REWRITE every direction you score under ${READER_PASS}: one new idea for the same rank that a reader of this headline would connect to the story at once, so it would score 8 or more. Rules for a rewrite:
- Show this story's specific subject and what is happening to it, through things a reader recognises without a logo (a headquarters, a product, a store, a crop, the instrument of a policy).
- One clear image of one or two big elements that reads as a small thumbnail; mustShow lists 2 to 4 concrete elements, the focal subject first.
- No text, letters, numbers, labels, logos or currency symbols anywhere; no stock cliches.
- Keep it different from the other directions, and keep the story's ${input.tone} tone.${restrained ? '\n- This is a sensitive story: keep it restrained and respectful, with no injury, blood, weapons or mockery.' : ''}
- People and things each rank must keep out:
${input.directions.map((d) => safetyLine(input, d)).join('\n')}
- whyItFits: one line, at most 160 characters, linking the image to what changed.
Directions scoring ${READER_PASS} or more get "rewrite": null.`
    );
  }
  const rewriteShape = opts.rewrite ? ',\n      "rewrite": null | { "title": string (at most 60 characters), "idea": string, "mustShow": [string], "whyItFits": string }' : '';
  parts.push(`Return only JSON:
{
  "directions": [
    {
      "rank": 1,
      "score": 1-10,
      "reason": string (at most 140 characters: what a reader would or would not get)${rewriteShape}
    }
  ]
}
One entry per direction above.`);
  return parts.join('\n\n');
}

async function ask(ctx: CallContext, input: ReaderTestInput, rewrite: boolean): Promise<ReaderTestOutput> {
  return chat(
    { ...ctx, stage: rewrite ? 'reader_test' : 'reader_rescore' },
    {
      kind: 'reader_test',
      model: env().EA_JUDGE_MODEL,
      system: READER_TEST_SYSTEM_PROMPT,
      user: buildReaderTestUser(input, { rewrite }),
      temperature: rewrite ? 0.4 : 0,
      maxTokens: rewrite ? 1400 : 400,
      timeoutMs: 30_000,
    },
    ReaderTestOutput,
    ESTIMATE_INR.readerTest
  );
}

/**
 * Pure: folds the first answer and the re-score into one verdict per rank. A rewrite is kept only
 * when its re-score beats the original; without a re-score the original stands.
 */
export function mergeReaderVerdicts(
  ranks: number[],
  first: ReaderTestOutput['directions'],
  rescore: ReaderTestOutput['directions'] | null
): ReaderVerdict[] {
  return ranks.flatMap((rank): ReaderVerdict[] => {
    const a = first.find((d) => d.rank === rank);
    if (!a) return [];
    const b = rescore?.find((d) => d.rank === rank);
    if (a.score < READER_PASS && a.rewrite && b && b.score > a.score) {
      return [{ rank, score: b.score, reason: b.reason, rewrite: a.rewrite }];
    }
    return [{ rank, score: a.score, reason: a.reason, rewrite: null }];
  });
}

/** Runs the test; returns one verdict per direction it scored, or null when it could not run. */
export async function runReaderTest(ctx: CallContext, input: ReaderTestInput): Promise<ReaderVerdict[] | null> {
  if (!input.directions.length) return null;
  const log = { eaRequestId: ctx.requestId, stage: 'reader_test' };
  let first: ReaderTestOutput;
  try {
    first = await ask(ctx, input, true);
  } catch (error) {
    logger.warn({ ...log, err: errorSummary(error) }, 'reader_test_skipped');
    return null;
  }
  const weak = first.directions.filter((d) => d.score < READER_PASS && d.rewrite);
  let rescore: ReaderTestOutput['directions'] | null = null;
  if (weak.length) {
    const rewritten = input.directions
      .filter((d) => weak.some((w) => w.rank === d.rank))
      .map((d) => ({ ...d, ...weak.find((w) => w.rank === d.rank)!.rewrite! }));
    try {
      rescore = (await ask(ctx, { ...input, directions: rewritten }, false)).directions;
    } catch (error) {
      logger.warn({ ...log, err: errorSummary(error) }, 'reader_rescore_skipped');
    }
  }
  const verdicts = mergeReaderVerdicts(
    input.directions.map((d) => d.rank),
    first.directions,
    rescore
  );
  logger.info({ ...log, scores: verdicts.map((v) => [v.rank, v.score, v.rewrite ? 'rewritten' : 'kept']) }, 'reader_test');
  return verdicts;
}
