import { ExemplarScreen, ReferenceDescription, exemplarPasses } from '@editorial-art/shared-types';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { db } from '../lib/db';
import { env } from '../lib/env';
import { ApiError } from '../lib/errors';
import { logger } from '../lib/logger';
import { ESTIMATE_INR } from '../lib/pricing';
import { chat, embedText, generateImage, type CallContext } from '../pipeline/ai';
import { providers, type ImageData } from '../providers';
import { storeEmbedding } from './references';
import { ruleSummary, styleById, type StyleView } from './styles';

/**
 * Exemplars: the images the model actually sees for each house style (Step 5.5). Every style is
 * drawn on the same neutral subjects so styles stay comparable, and people only ever appear
 * generically. Each candidate is screened, described and embedded once, at intake, so nothing has
 * to look at it again when a request picks references.
 */

/** Step 5.5.1.1: the fixed subject set, identical for every style. */
export const NEUTRAL_SUBJECTS = [
  'a stock chart turning into a mountain path',
  'a rupee coin balanced on a scale',
  'a city skyline at dawn',
  'a factory with smoke turning into clouds',
  'two chess pieces facing each other',
  "a farmer's field with a tractor",
  'a smartphone with light coming out',
  'a ship with containers at a port',
  'a solar farm and wind turbines',
  'a courtroom gavel and books',
  'a crowd of anonymous commuters',
  'a person at a desk with a laptop, seen from behind',
  'a bank vault door',
  'a road splitting in two directions',
  'a seedling growing out of coins',
  'a rocket launch over the sea',
  'a handshake between two anonymous people',
  'a hospital corridor',
  'a classroom with empty desks',
  'a railway platform',
  'a gold bar and a magnifying glass',
  'an oil derrick at sunset',
  'a satellite over the earth',
  'a market street with stalls',
  'a generic parliament-like building, not a real one',
  'a robot hand and a human hand',
  'a wallet with cards',
  'a monsoon street with umbrellas',
  'a puzzle with one missing piece',
  'a mountain of paper documents',
] as const;

/** How many approved references the bootstrap pass sends (A.5.3). */
export const BOOTSTRAP_REFERENCES = 5;

/** Cost to plan for per exemplar: the image, the screen, the description and the embedding. */
export const EXEMPLAR_ESTIMATE_INR = ESTIMATE_INR.previewImage + ESTIMATE_INR.judge + ESTIMATE_INR.text + ESTIMATE_INR.embed;

function photorealRule(style: StyleView): string {
  return style.safety.photoreal ? ' This is a photographic image of objects and places only. No people.' : ' Do not make it look like a photograph.';
}

function peopleLine(style: StyleView): string {
  if (!style.safety.allowsPeople) return 'People: no people at all.';
  return 'People: no identifiable people. Anonymous figures may appear only small, distant, or from behind.';
}

/** A.5.2, plus the A.5.3 paragraph when approved references are attached. */
export function exemplarPrompt(style: StyleView, subject: string, withReferences: boolean): string {
  const parts = [
    style.ruleSheet.promptCore,
    `Scene: ${subject}. A single clear focal point with generous negative space.`,
    peopleLine(style),
    `Rules that always apply: no text, letters, numbers, words, logos, brand marks, watermarks, signatures or user-interface elements anywhere in the image.${photorealRule(style)}`,
    `Avoid: ${style.ruleSheet.negative}.`,
  ];
  if (withReferences) {
    parts.push(
      'The attached images are approved examples of this exact house style. Match their medium, palette, line quality and texture as closely as possible. Do not copy their subjects or layout.'
    );
  }
  return parts.join('\n\n');
}

const SCREEN_SYSTEM = 'You check a candidate reference image for a house style library. Answer only with JSON in the exact shape given. No prose.';

export function screenPrompt(style: StyleView): string {
  return `Style: ${style.label}. Rules: ${ruleSummary(style.ruleSheet)}
Return only JSON:
{ "hasText": boolean, "hasWatermarkOrSignature": boolean, "anatomyOk": boolean,
  "onStyle": 1 | 2 | 3 | 4 | 5, "reason": string }
"hasText" is true for any letters, digits or marks that read as writing. "anatomyOk" is true when there are no people. "reason" is at most 200 characters.`;
}

const DESCRIBE_SYSTEM = 'Describe this illustration for a search index used to pick style references. Answer only with JSON. Do not mention any artist, brand or real person by name.';

export const DESCRIBE_USER = `Return only JSON:
{
  "description": string,
  "subjects": [string],
  "mood": string
}
"description": 60 to 120 words: what is shown, composition, colours, mood, medium.
"subjects": 1 to 6 lowercase tags from: people, crowd, money, coin, chart, building, city, factory, farm, vehicle, ship, technology, phone, nature, sky, water, document, object, abstract, symbol, animal, food, energy, health.
"mood": one or two words, e.g. "calm", "tense", "hopeful", "sombre".`;

/** Cloudinary folder for a style's references. */
export function libraryFolder(slug: string): string {
  return `${env().EA_CLOUDINARY_FOLDER}/library/${slug}`;
}

export function slugify(text: string, max = 40): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, max)
      .replace(/-+$/, '') || 'image'
  );
}

/** Stored library images are WebP, at most 1600 wide: enough for a 1024-wide reference fetch. */
export async function toLibraryWebp(buffer: Buffer): Promise<ImageData> {
  const out = await sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  return { buffer: out, mimeType: 'image/webp' };
}

async function approvedReferenceImages(styleId: string, limit: number): Promise<ImageData[]> {
  const refs = await db.styleReference.findMany({
    where: { styleId, status: 'APPROVED' },
    orderBy: [{ pickCount: 'desc' }, { createdAt: 'asc' }],
    take: limit,
    select: { url: true },
  });
  return Promise.all(refs.map((r) => providers().fetchImage(r.url, 1024)));
}

export type ExemplarOutcome =
  | { status: 'skipped'; referenceId: string }
  | { status: 'created'; referenceId: string; passed: boolean; reason: string };

/**
 * Makes one exemplar candidate. A subject already generated for the style (and not rejected) is
 * skipped, so re-running a style only pays for what is missing or was thrown out.
 */
export async function generateExemplar(styleId: string, subject: string, useApprovedAsRefs: boolean): Promise<ExemplarOutcome> {
  const style = await styleById(styleId);
  if (!style) throw ApiError.notFound('No such style.');

  const existing = await db.styleReference.findFirst({
    where: { styleId, subjectHint: subject, status: { not: 'REJECTED' } },
    select: { id: true },
  });
  if (existing) return { status: 'skipped', referenceId: existing.id };

  const references = useApprovedAsRefs ? await approvedReferenceImages(styleId, BOOTSTRAP_REFERENCES) : [];
  const ctx: CallContext = { stage: 'exemplar' };
  const generated = await generateImage(
    ctx,
    {
      provider: 'gemini',
      model: env().EA_PREVIEW_MODEL,
      prompt: exemplarPrompt(style, subject, references.length > 0),
      images: references,
      aspectRatio: '1:1',
    },
    ESTIMATE_INR.previewImage
  );

  const image = await toLibraryWebp(generated.image.buffer);
  const uploaded = await providers().upload(image, {
    folder: libraryFolder(style.slug),
    publicId: `${slugify(subject)}-${randomBytes(4).toString('hex')}`,
    format: 'webp',
    tags: ['library', `style:${style.slug}`],
  });

  const reference = await db.styleReference.create({
    data: {
      styleId,
      source: 'GENERATED',
      sourceNote: `Generated with ${generated.model}${references.length ? ` from ${references.length} approved references` : ''}.`,
      subjectHint: subject,
      url: uploaded.url,
      publicId: uploaded.publicId,
      width: uploaded.width,
      height: uploaded.height,
      description: '',
      subjects: [],
      mood: '',
    },
  });

  const screen = await screenReference(style, reference.id, image);
  if (!screen.passed) {
    // Kept and shown to the reviewer with the reason, but never described or picked.
    return { status: 'created', referenceId: reference.id, ...screen };
  }
  await describeAndEmbed(reference.id, image);
  return { status: 'created', referenceId: reference.id, ...screen };
}

/** A.5.4: the automatic screen. A failure rejects the candidate with the reason. */
async function screenReference(style: StyleView, referenceId: string, image: ImageData): Promise<{ passed: boolean; reason: string }> {
  const verdict = await chat(
    { stage: 'screen' },
    { kind: 'screen_exemplar', model: env().EA_JUDGE_MODEL, system: SCREEN_SYSTEM, user: screenPrompt(style), images: [image], temperature: 0 },
    ExemplarScreen,
    ESTIMATE_INR.judge
  );
  const passed = exemplarPasses(verdict);
  const reason = passed ? verdict.reason || 'Passed the automatic screen.' : verdict.reason || failureReason(verdict);
  await db.styleReference.update({
    where: { id: referenceId },
    data: {
      screen: { passed, reason },
      ...(passed ? {} : { status: 'REJECTED', reviewNote: `Automatic screen: ${reason}` }),
    },
  });
  return { passed, reason };
}

function failureReason(v: ExemplarScreen): string {
  if (v.hasText) return 'Text detected.';
  if (v.hasWatermarkOrSignature) return 'Watermark or signature detected.';
  if (!v.anatomyOk) return 'Anatomy looks wrong.';
  return 'Off-style.';
}

/** A.6.1 plus the embedding the reference picker searches. */
async function describeAndEmbed(referenceId: string, image: ImageData): Promise<void> {
  const described = await chat(
    { stage: 'describe' },
    { kind: 'describe_reference', model: env().EA_JUDGE_MODEL, system: DESCRIBE_SYSTEM, user: DESCRIBE_USER, images: [image], temperature: 0.2 },
    ReferenceDescription,
    ESTIMATE_INR.text
  );
  await db.styleReference.update({
    where: { id: referenceId },
    data: { description: described.description, subjects: described.subjects, mood: described.mood },
  });
  const vector = await embedText({ stage: 'embed' }, described.description);
  await storeEmbedding(referenceId, vector, env().EA_EMBED_MODEL);
}

/** For uploaded ET archive or licensed references: describe and embed what was uploaded. */
export async function describeReference(referenceId: string): Promise<void> {
  const reference = await db.styleReference.findUnique({ where: { id: referenceId }, select: { id: true, url: true, status: true } });
  if (!reference) {
    logger.warn({ referenceId }, 'describe_reference_missing');
    return;
  }
  if (reference.status === 'RETIRED') return;
  const image = await providers().fetchImage(reference.url, 1024);
  await describeAndEmbed(reference.id, image);
}
