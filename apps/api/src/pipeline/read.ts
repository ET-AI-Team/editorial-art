import { MUST_SHOW_MAX, ReadOutput, type ReadDirection, type ReadHook, type SensitivityLevel } from '@editorial-art/shared-types';
import { audit } from '../lib/audit';
import { db } from '../lib/db';
import { env } from '../lib/env';
import { StageError } from '../lib/errors';
import { logger } from '../lib/logger';
import { ESTIMATE_INR } from '../lib/pricing';
import { escapeDelimited, textForRead } from '../lib/text';
import { liveStyles, styleAllowed, type StyleView } from '../library/styles';
import { BadModelOutput } from '../providers';
import { chat, maybeCrash } from './ai';
import { createBatch } from './batches';
import { emitRequestStatus } from './events';
import { runReaderTest, type ReaderVerdict } from './reader-test';
import { finalSensitivity, fold, sensitivityFloor } from './guard/sensitivity';
import { stripInstructions } from './guard/strip';
import { activeLikenessNames, pauseForPeople, realFacesNote } from './people';
import { moveRequest } from './state';
import { READ_SYSTEM_PROMPT } from './system-prompts';

/**
 * Stage 1 (Step 6.3): read the article into a brief and three directions, apply the guardrails in
 * code, then start the first batch.
 */

const MAX_SHAPE_RETRIES = 3;

export interface PeopleEntry {
  name: string;
  how: 'illustrated' | 'symbolised' | 'absent';
  likenessId: string | null;
}

interface LikenessName {
  id: string;
  name: string;
  aliases: string[];
}

export function buildReadUserMessage(input: {
  styles: StyleView[];
  chosenStyle: StyleView | null;
  likenesses: LikenessName[];
  title: string | null;
  text: string;
  chars: number;
  truncated: boolean;
  editorPrompt: string | null;
  retryNote?: string;
}): string {
  const styleList = input.styles
    .map((s) => `- ${s.slug} | ${s.label} | ${s.goodFor.join(', ')} | sensitive: ${s.safety.allowsSensitive ? 'yes' : 'no'}`)
    .join('\n');
  const chosen = input.chosenStyle ? `The editor has chosen the style "${input.chosenStyle.slug}". Use it for all three directions.` : '';
  const names = input.likenesses.length ? input.likenesses.map((l) => [l.name, ...l.aliases].join(' / ')).join(', ') : 'none';
  const title = (input.title ?? '').replace(/"/g, "'");
  const parts = [
    `AVAILABLE STYLES (slug | label | good for | sensitive)\n${styleList}`,
    chosen,
    `KNOWN PEOPLE WITH APPROVED LIKENESS PHOTOS (names and aliases)\n${names}`,
    `<article title="${title}" chars="${input.chars}" truncated="${input.truncated}">\n${escapeDelimited(input.text, 'article')}\n</article>`,
    `<editor_request>\n${input.editorPrompt ? escapeDelimited(input.editorPrompt, 'editor_request') : '(none)'}\n</editor_request>`,
  ].filter(Boolean);
  if (input.retryNote) parts.push(`Your previous answer did not match the required shape: ${input.retryNote.slice(0, 300)}. Return the corrected JSON only.`);
  return parts.join('\n\n');
}

/** Picks the style for a direction: the editor's choice, else the model's if allowed, else the best desk match. */
export function resolveDirectionStyle(
  suggestedSlug: string,
  desk: string,
  styles: StyleView[],
  level: SensitivityLevel,
  chosen: StyleView | null
): StyleView | null {
  const allowed = styles.filter((s) => styleAllowed(s, level));
  if (chosen) return allowed.some((s) => s.id === chosen.id) ? chosen : null;
  const suggested = allowed.find((s) => s.slug === suggestedSlug);
  if (suggested) return suggested;
  return allowed.find((s) => s.goodFor.some((g) => fold(g).includes(desk))) ?? allowed[0] ?? null;
}

function matchLikeness(name: string, likenesses: LikenessName[]): string | null {
  const key = fold(name).trim();
  const hit = likenesses.find((l) => [l.name, ...l.aliases].some((n) => fold(n).trim() === key));
  return hit?.id ?? null;
}

/** The people policy (Step 6.3.4.4), applied in code whatever the model said. */
export function applyPeoplePolicy(
  direction: ReadDirection,
  minors: Set<string>,
  style: StyleView,
  level: SensitivityLevel,
  likenesses: LikenessName[]
): PeopleEntry[] {
  return direction.peopleDepicted.map((p) => {
    const isMinor = minors.has(fold(p.name).trim());
    if (isMinor || p.how === 'absent') return { name: p.name, how: 'absent' as const, likenessId: null };
    if (level === 'HIGH' || !style.safety.allowsRealPeople || p.how === 'symbolised') {
      return { name: p.name, how: 'symbolised' as const, likenessId: null };
    }
    return { name: p.name, how: 'illustrated' as const, likenessId: matchLikeness(p.name, likenesses) };
  });
}

function cleanDirection(d: ReadDirection): ReadDirection {
  return {
    ...d,
    title: stripInstructions(d.title, 60).text || `Direction ${d.rank}`,
    idea: stripInstructions(d.idea, 600).text || d.title,
    mustShow: d.mustShow.map((m) => stripInstructions(m, 120).text).filter(Boolean).slice(0, MUST_SHOW_MAX),
    whyItFits: stripInstructions(d.whyItFits, 200).text,
    reason: stripInstructions(d.reason, 120).text,
    avoid: d.avoid.map((a) => stripInstructions(a, 80).text).filter(Boolean),
  };
}

/** The hook reaches image and judge prompts, so it is cleaned like a direction. */
export function cleanHook(h: ReadHook): ReadHook {
  const clean = (v: string, max: number) => stripInstructions(v, max).text;
  return {
    claim: clean(h.claim, 200),
    actors: h.actors.map((a) => clean(a, 120)).filter(Boolean),
    tension: clean(h.tension, 120),
    stake: clean(h.stake, 160),
    readerTakeaway: clean(h.readerTakeaway, 200),
    indianContext: clean(h.indianContext, 200),
  };
}

/** A reader-test rewrite replaces the idea only; style, people and avoid list stay as read. */
export function applyReaderVerdict(d: ReadDirection, verdict: ReaderVerdict | undefined): { d: ReadDirection; readerScore: number | null; readerReason: string | null } {
  if (!verdict) return { d, readerScore: null, readerReason: null };
  const next = verdict.rewrite ? cleanDirection({ ...d, ...verdict.rewrite }) : d;
  return { d: next, readerScore: verdict.score, readerReason: stripInstructions(verdict.reason, 300).text || null };
}

async function fail(requestId: string, publicId: string, code: string, reason: string): Promise<void> {
  await moveRequest(requestId, 'FAILED', { failureCode: code, failureReason: reason });
  emitRequestStatus(publicId, 'FAILED');
}

export async function runRead(requestId: string): Promise<void> {
  const request = await db.request.findUnique({ where: { id: requestId } });
  if (!request || !['RECEIVED', 'READING'].includes(request.status)) return;
  if (!(await moveRequest(request.id, 'READING', {}, ['RECEIVED', 'READING']))) return;
  emitRequestStatus(request.publicId, 'READING');

  if (!request.articleText) return fail(request.id, request.publicId, 'READ_FAILED', 'The article text is no longer available.');

  const styles = await liveStyles();
  if (!styles.length) return fail(request.id, request.publicId, 'STYLE_NOT_READY', 'No styles are ready yet. Try again once the style library is published.');
  const chosen = request.styleId ? (styles.find((s) => s.id === request.styleId) ?? null) : null;
  if (request.styleId && !chosen) return fail(request.id, request.publicId, 'STYLE_NOT_LIVE', 'The chosen style is not available any more.');

  const likenesses = await activeLikenessNames(request.actorRole);
  const forRead = textForRead(request.articleText);

  let answer: ReadOutput | undefined;
  let retryNote: string | undefined;
  for (let attempt = 1; attempt <= MAX_SHAPE_RETRIES && !answer; attempt++) {
    try {
      answer = await chat(
        { stage: 'read', requestId: request.id },
        {
          kind: 'read',
          model: env().EA_READ_MODEL,
          system: READ_SYSTEM_PROMPT,
          user: realFacesNote(request.actorRole) + buildReadUserMessage({
            styles,
            chosenStyle: chosen,
            likenesses,
            title: request.articleTitle,
            text: forRead.text,
            chars: request.articleChars,
            truncated: forRead.truncated,
            editorPrompt: request.prompt,
            retryNote,
          }),
          temperature: 0.3,
          maxTokens: 2200,
        },
        ReadOutput,
        ESTIMATE_INR.read
      );
    } catch (error) {
      if (!(error instanceof BadModelOutput)) throw error;
      retryNote = error.message;
      if (attempt === MAX_SHAPE_RETRIES) return fail(request.id, request.publicId, 'READ_FAILED', "We couldn't read this article. Check the text and try again.");
    }
  }
  if (!answer) return;
  maybeCrash('read');

  const floor = sensitivityFloor({ text: request.articleText, title: request.articleTitle, editorPrompt: request.prompt });
  const level = finalSensitivity(answer.sensitivity.level, floor);
  if (floor.ruleIds.length) logger.info({ eaRequestId: request.publicId, ruleIds: floor.ruleIds, modelLevel: answer.sensitivity.level, level }, 'sensitivity_floor');

  if (level === 'BLOCKED') {
    await db.request.update({ where: { id: request.id }, data: { sensitivity: 'BLOCKED' } });
    return fail(
      request.id,
      request.publicId,
      'CONTENT_BLOCKED',
      "This story can't be illustrated with AI under ET's rules. Use a photo or a desk illustration."
    );
  }
  if (chosen && !styleAllowed(chosen, level)) {
    const allowed = styles.filter((s) => styleAllowed(s, level)).map((s) => s.label);
    return fail(
      request.id,
      request.publicId,
      'STYLE_NOT_ALLOWED_FOR_STORY',
      `"${chosen.label}" isn't used for stories like this one. Try: ${allowed.slice(0, 6).join(', ')}.`
    );
  }

  const minors = new Set(answer.entities.people.filter((p) => p.isMinor).map((p) => fold(p.name).trim()));
  const directions = answer.directions.map(cleanDirection).map((d) => {
    const style = resolveDirectionStyle(d.suggestedStyleSlug, answer!.desk, styles, level, chosen);
    return { d, style };
  });
  if (directions.some((x) => !x.style)) return fail(request.id, request.publicId, 'STYLE_NOT_READY', 'No style is available for this story yet.');

  const hook = cleanHook(answer.hook);
  const verdicts = await runReaderTest(
    { stage: 'reader_test', requestId: request.id },
    {
      headline: request.articleTitle || answer.headline,
      claim: hook.claim || answer.thesis,
      tone: answer.tone,
      level,
      directions: directions.map(({ d }) => ({ ...d, people: d.peopleDepicted.filter((p) => p.how !== 'absent').map((p) => p.name) })),
    }
  );
  const tested = directions.map((x) => ({ ...applyReaderVerdict(x.d, verdicts?.find((v) => v.rank === x.d.rank)), style: x.style }));

  const reasons = [...new Set([...answer.sensitivity.reasons, ...(floor.level === level && level !== 'NONE' ? ['flagged by newsroom rules'] : [])])].slice(0, 4);
  await db.$transaction(async (tx) => {
    const latest = await tx.brief.findFirst({ where: { requestId: request.id }, orderBy: { version: 'desc' }, select: { version: true } });
    await tx.brief.create({
      data: {
        requestId: request.id,
        version: (latest?.version ?? 0) + 1,
        headline: answer!.headline,
        thesis: answer!.thesis,
        entities: answer!.entities,
        tone: answer!.tone,
        desk: answer!.desk,
        sensitivity: level,
        sensitivityReasons: reasons,
        altTextSeed: answer!.altTextSeed,
        hook,
        truncatedForRead: forRead.truncated,
        model: env().EA_READ_MODEL,
        directions: {
          create: tested.map(({ d, style, readerScore, readerReason }) => ({
            rank: d.rank,
            title: d.title,
            idea: d.idea,
            mustShow: d.mustShow,
            whyItFits: d.whyItFits,
            readerScore,
            readerReason,
            suggestedStyleId: style!.id,
            reason: d.reason,
            peopleDepicted: applyPeoplePolicy(d, minors, style!, level, likenesses) as object,
            avoid: d.avoid,
          })),
        },
      },
    });
    await tx.request.update({ where: { id: request.id }, data: { sensitivity: level } });
  });

  if (await pauseForPeople(request.id)) return;
  if (!(await moveRequest(request.id, 'DIRECTIONS_READY', {}, ['READING']))) return;
  emitRequestStatus(request.publicId, 'DIRECTIONS_READY', { directionsReady: true });

  try {
    await createBatch({ requestId: request.id, kind: 'INITIAL', requestedBy: request.actorUserId });
  } catch (error) {
    if (error instanceof StageError) return fail(request.id, request.publicId, error.code, error.message);
    throw error;
  }
  await audit({ action: 'request.create', targetType: 'request', targetId: request.publicId, actorUserId: request.actorUserId, metadata: { stage: 'read', level } });
}
