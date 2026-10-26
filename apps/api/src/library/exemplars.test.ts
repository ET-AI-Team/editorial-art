import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { resetDb } from '../../test/db';
import { db } from '../lib/db';
import { setProviders, type ChatJsonParams, type ImageGenParams, type Providers } from '../providers';
import { createFakeProviders } from '../providers/fake/fake-providers';
import { describeReference, exemplarPrompt, generateExemplar, NEUTRAL_SUBJECTS } from './exemplars';
import { seedStyles, styleById } from './styles';

let fake: ReturnType<typeof createFakeProviders>;
let imageCalls: ImageGenParams[];

/** The fakes, with image calls recorded and an optional override for the screen answer. */
function install(screen?: (p: ChatJsonParams) => unknown): void {
  fake = createFakeProviders();
  imageCalls = [];
  const wrapped: Providers = {
    ...fake,
    geminiImage: (p) => {
      imageCalls.push(p);
      return fake.geminiImage(p);
    },
    chatJson: async (p) => (screen && p.kind === 'screen_exemplar' ? { json: screen(p), usage: { input: 100, cachedInput: 0, output: 50 }, model: p.model } : fake.chatJson(p)),
  };
  setProviders(wrapped);
}

async function styleId(slug: string): Promise<string> {
  return (await db.style.findUniqueOrThrow({ where: { slug }, select: { id: true } })).id;
}

beforeEach(async () => {
  await resetDb();
  await seedStyles();
  install();
});

afterAll(async () => {
  setProviders(undefined);
  await db.$disconnect();
});

describe('exemplar prompts', () => {
  test('carry the style core and the hard rules, and never a person to imitate', async () => {
    const style = (await styleById(await styleId('ink-wash')))!;
    const prompt = exemplarPrompt(style, NEUTRAL_SUBJECTS[0], false);
    expect(prompt.startsWith(style.ruleSheet.promptCore)).toBe(true);
    expect(prompt).toContain('no text, letters, numbers');
    expect(prompt).toContain('Do not make it look like a photograph.');
    expect(prompt).not.toMatch(/in the style of/i);
    expect(prompt).not.toContain('approved examples');
  });

  test('photo-based styles are objects and places only', async () => {
    const style = (await styleById(await styleId('still-life')))!;
    const prompt = exemplarPrompt(style, NEUTRAL_SUBJECTS[1], true);
    expect(prompt).toContain('objects and places only. No people.');
    expect(prompt).toContain('People: no people at all.');
    expect(prompt).toContain('approved examples of this exact house style');
  });

  test('there are 30 distinct neutral subjects', () => {
    expect(new Set(NEUTRAL_SUBJECTS).size).toBe(30);
  });
});

describe('generating an exemplar', () => {
  test('makes a candidate that is screened, described and embedded', async () => {
    const id = await styleId('ink-wash');
    const outcome = await generateExemplar(id, NEUTRAL_SUBJECTS[0], false);
    expect(outcome).toMatchObject({ status: 'created', passed: true });
    const ref = await db.styleReference.findUniqueOrThrow({ where: { id: outcome.referenceId } });
    expect(ref).toMatchObject({ source: 'GENERATED', status: 'CANDIDATE', subjectHint: NEUTRAL_SUBJECTS[0], embeddingModel: 'text-embedding-3-small' });
    expect(ref.description.length).toBeGreaterThan(40);
    expect(ref.subjects.length).toBeGreaterThan(0);
    expect(ref.screen).toMatchObject({ passed: true });
    expect(ref.url).toContain('/library/ink-wash/');
    const rows = await db.$queryRaw<{ embedded: boolean }[]>`SELECT embedding IS NOT NULL AS embedded FROM "StyleReference" WHERE id = ${ref.id}`;
    expect(rows[0]?.embedded).toBe(true);
    // The image, the screen, the description and the embedding were all paid for and recorded.
    expect((await db.attempt.findMany()).map((a) => a.stage).sort()).toEqual(['describe', 'embed', 'exemplar', 'screen']);
  });

  test('a subject already done is skipped without spending', async () => {
    const id = await styleId('ink-wash');
    const first = await generateExemplar(id, NEUTRAL_SUBJECTS[2], false);
    const callsBefore = fake.calls.length;
    const second = await generateExemplar(id, NEUTRAL_SUBJECTS[2], false);
    expect(second).toEqual({ status: 'skipped', referenceId: first.referenceId });
    expect(fake.calls.length).toBe(callsBefore);
  });

  test('a failed screen rejects the candidate with the reason, and the subject can be tried again', async () => {
    install(() => ({ hasText: true, hasWatermarkOrSignature: false, anatomyOk: true, onStyle: 4, reason: 'Lettering on the coin.' }));
    const id = await styleId('ink-wash');
    const outcome = await generateExemplar(id, NEUTRAL_SUBJECTS[1], false);
    expect(outcome).toMatchObject({ status: 'created', passed: false, reason: 'Lettering on the coin.' });
    const ref = await db.styleReference.findUniqueOrThrow({ where: { id: outcome.referenceId } });
    expect(ref.status).toBe('REJECTED');
    expect(ref.reviewNote).toContain('Lettering on the coin.');
    expect(ref.description).toBe('');
    install();
    expect((await generateExemplar(id, NEUTRAL_SUBJECTS[1], false)).status).toBe('created');
  });

  test('the bootstrap pass sends up to five approved references of the style', async () => {
    const id = await styleId('ink-wash');
    for (const subject of NEUTRAL_SUBJECTS.slice(0, 6)) {
      const o = await generateExemplar(id, subject, false);
      await db.styleReference.update({ where: { id: o.referenceId }, data: { status: 'APPROVED' } });
    }
    imageCalls = [];
    await generateExemplar(id, NEUTRAL_SUBJECTS[10], true);
    expect(imageCalls).toHaveLength(1);
    expect(imageCalls[0]!.images).toHaveLength(5);
    expect(imageCalls[0]!.prompt).toContain('approved examples');
  });

  test('an unknown style is a 404', async () => {
    await expect(generateExemplar('00000000-0000-4000-8000-000000000000', 'x', false)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('describing an uploaded reference', () => {
  test('fills the description, tags and embedding', async () => {
    const id = await styleId('collage');
    const ref = await db.styleReference.create({
      data: { styleId: id, source: 'ET_ARCHIVE', sourceNote: 'ET archive, 2024', url: 'https://res.cloudinary.com/fake/image/upload/v1/x.webp', publicId: 'x', width: 1600, height: 900, description: '', subjects: [], mood: '' },
    });
    await describeReference(ref.id);
    const after = await db.styleReference.findUniqueOrThrow({ where: { id: ref.id } });
    expect(after.description.length).toBeGreaterThan(40);
    expect(after.embeddingModel).toBe('text-embedding-3-small');
  });
});
