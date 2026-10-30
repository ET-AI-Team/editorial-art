import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { JudgeOutput, judgePasses, PreviewTextCheck, RequestDetail, type SentImageCall } from '@editorial-art/shared-types';
import type { AddressInfo } from 'node:net';
import sharp from 'sharp';
import { resetDb } from '../../test/db';
import { liveLibrary } from '../../test/harness';
import { requestRow } from '../../test/rows';
import { createApp } from '../app';
import { brandLogosAllowed } from '../lib/brand-logos';
import { db } from '../lib/db';
import { resetEnvForTests } from '../lib/env';
import { closeRedis } from '../lib/redis';
import { setBinaryFetchForTests } from '../lib/remote-image';
import { styleById } from '../library/styles';
import { setWikimediaHttpForTests } from '../library/wikimedia';
import { setProviders } from '../providers';
import { createFakeProviders } from '../providers/fake/fake-providers';
import { closeQueues } from '../queues/queues';
import { requestsRouter } from '../routes/requests.routes';
import { LOGO_AGAIN, logoCredits } from './brand-logo';
import { withFaceCredits } from './people';
import { previewTextUser, runPreview } from './preview';
import { buildJudgeUser } from './prompts';
import { runRead } from './read';

/**
 * Official brand logos in-process, with fake image models and a mocked Wikidata and Commons. The
 * fake read's main subject is Example Group (a company); with a BRAND LOGO note its direction 1
 * (chess kings, options 0 and 3) asks for the logo and the others do not.
 */

const server = createApp({ api: [requestsRouter] }).listen(0);
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
const HEADERS = { 'x-api-key': 'test-key-one', 'x-actor-user-id': '11111111-1111-4111-8111-111111111111', 'x-actor-workspace-id': '22222222-2222-4222-8222-222222222222', 'x-actor-role': 'member' };

function gate(mode: 'off' | 'admins' | 'all'): void {
  process.env.EA_BRAND_LOGOS = mode;
  resetEnvForTests();
}

const item = (id: string) => ({ mainsnak: { snaktype: 'value', datavalue: { value: { id } } }, rank: 'normal' });
let wikiCalls = 0;

async function wiki(_url: string, params: Record<string, string>): Promise<unknown> {
  wikiCalls++;
  if (params.action === 'wbsearchentities') return { search: params.search === 'Example Group' ? [{ id: 'Q2001' }] : [] };
  if (params.action === 'wbgetentities') {
    return {
      entities: {
        Q2001: {
          id: 'Q2001',
          labels: { en: { value: 'Example Group' } },
          aliases: { en: [] },
          claims: { P31: [item('Q4830453')], P17: [item('Q668')], P154: [{ mainsnak: { snaktype: 'value', datavalue: { value: 'Example Group logo.svg' } }, rank: 'normal' }] },
          sitelinks: {},
        },
      },
    };
  }
  return {
    query: {
      pages: [
        {
          imageinfo: [
            {
              thumburl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eg/Example_Group_logo.svg/1280px-Example_Group_logo.svg.png',
              thumbwidth: 1024,
              thumbheight: 512,
              descriptionurl: 'https://commons.wikimedia.org/wiki/File:Example_Group_logo.svg',
              extmetadata: { LicenseShortName: { value: 'Public domain' }, Artist: { value: 'Example Group' } },
            },
          ],
        },
      ],
    },
  };
}

let fake: ReturnType<typeof createFakeProviders>;

beforeAll(async () => {
  await resetDb();
  await liveLibrary(['ink-wash', 'watercolour'], 4);
  const png = await sharp({ create: { width: 1280, height: 640, channels: 4, background: { r: 15, g: 124, b: 124, alpha: 1 } } }).png().toBuffer();
  setBinaryFetchForTests(async () => png);
  setWikimediaHttpForTests(wiki);
});

beforeEach(async () => {
  gate('all');
  wikiCalls = 0;
  // Each test finds the logo afresh, so each one shows its own lookup.
  await db.brandLogo.deleteMany();
  setWikimediaHttpForTests(wiki);
  fake = createFakeProviders();
  setProviders(fake);
});

afterAll(async () => {
  gate('off');
  setWikimediaHttpForTests();
  setBinaryFetchForTests();
  server.close();
  await closeQueues();
  await closeRedis();
  await db.$disconnect();
});

async function read(title: string, opts: { articleText?: string; actorRole?: string } = {}) {
  const row = await requestRow({ articleTitle: title, articleText: opts.articleText });
  if (opts.actorRole) await db.request.update({ where: { id: row.id }, data: { actorRole: opts.actorRole } });
  await runRead(row.id);
  const brief = await db.brief.findFirstOrThrow({ where: { requestId: row.id }, include: { directions: { orderBy: { rank: 'asc' } } } });
  const batch = await db.batch.findFirst({ where: { requestId: row.id }, include: { options: { orderBy: { index: 'asc' } } } });
  return { request: row, brief, batch };
}

async function previews(batchId: string) {
  for (const o of await db.option.findMany({ where: { batchId }, orderBy: { index: 'asc' } })) await runPreview(o.id);
  return db.option.findMany({ where: { batchId }, orderBy: { index: 'asc' } });
}

const sent = (o: { previewInput: unknown }) => o.previewInput as SentImageCall;

describe('the brand logo', () => {
  test('only a direction that asks for it gets the logo, as a labelled attachment placed on its hero object', async () => {
    const { request, brief, batch } = await read('Tata Sons rejects Noel Tata objections');
    const logo = await db.brandLogo.findUniqueOrThrow({ where: { id: brief.brandLogoId! } });
    expect(logo).toMatchObject({ name: 'Example Group', wikidataId: 'Q2001', licence: 'Public domain', source: 'WIKIMEDIA' });
    expect(brief.directions.map((d) => d.useLogo)).toEqual([true, false, false]);
    expect(batch!.options.map((o) => o.brandLogoId)).toEqual([logo.id, null, null, logo.id]);

    const rows = await previews(batch!.id);
    const withLogo = sent(rows[0]!);
    expect(withLogo.prompt).toContain('Place the attached official Example Group logo on the hero object (two chess kings), reproduced exactly as given: same shape, letters and colours, flat and legible, sized like real branding on that object.');
    expect(withLogo.prompt).toContain('Do not invent or alter it. No other text anywhere.');
    expect(withLogo.prompt).toContain('Rules that always apply: apart from the attached official Example Group logo on the hero object, no text, letters, numbers');
    const logoImage = withLogo.images.find((i) => i.role === 'logo')!;
    expect(logoImage).toMatchObject({ url: logo.url, label: 'Official logo of Example Group (reproduce it exactly on the hero object, not a style reference):' });
    expect(withLogo.images.filter((i) => i.role === 'logo')).toHaveLength(1);

    const without = sent(rows[1]!);
    expect(without.images.some((i) => i.role === 'logo')).toBe(false);
    expect(without.prompt).not.toContain('official Example Group logo');
    expect(without.prompt).toContain('never write them, their initials or their logos.');

    // Only the options with a logo are judged on it.
    expect(rows.map((o) => o.logoOk)).toEqual([true, null, null, true]);
    const checks = fake.calls.filter((c) => c.kind === 'chat:story_check');
    expect(checks.map((c) => c.imageSides!.length)).toEqual([2, 1, 1, 2]);
    expect(checks.map((c) => c.imageDetail)).toEqual(['high', 'low', 'low', 'high']);

    const detail = RequestDetail.parse(await (await fetch(`${base}/requests/${request.publicId}`, { headers: HEADERS })).json());
    expect(detail.directions.map((d) => d.useLogo)).toEqual([true, false, false]);
    expect(detail.batches[0]!.options.find((o) => o.index === 0)!.logoOk).toBe(true);
    expect(detail.batches[0]!.options.find((o) => o.index === 1)!.logoOk).toBeNull();
  });

  test('the model decides: when no direction asks, nothing is looked up and no image carries one', async () => {
    const { brief, batch } = await read('FAKE_NO_LOGO Tata Sons rejects Noel Tata objections');
    expect(brief.brandLogoId).toBeNull();
    expect(brief.directions.every((d) => !d.useLogo)).toBe(true);
    expect(batch!.options.every((o) => o.brandLogoId === null)).toBe(true);
    expect(wikiCalls).toBe(0);
  });

  test('never on a sensitive story, whatever the model asked', async () => {
    const elevated = await read('Example Group probe', { articleText: 'Example Group executives were arrested in a fraud probe on Monday. The fraud allegations concern loans. The board met in Mumbai.' });
    expect(elevated.brief.sensitivity).toBe('ELEVATED');
    expect(elevated.brief.brandLogoId).toBeNull();
    expect(elevated.brief.directions.every((d) => !d.useLogo)).toBe(true);
    expect(elevated.batch!.options.every((o) => o.brandLogoId === null)).toBe(true);
    const high = await read('FAKE_HIGH Tata Sons rejects Noel Tata objections');
    expect(high.brief.brandLogoId).toBeNull();
    expect(high.brief.directions.every((d) => !d.useLogo)).toBe(true);
    expect(wikiCalls).toBe(0);
  });

  test('a broad-topic story has no subject, so no logo', async () => {
    const { brief, batch } = await read('FAKE_TOPIC Inflation eases in October');
    expect(brief.brandLogoId).toBeNull();
    expect(brief.directions.every((d) => !d.useLogo)).toBe(true);
    expect(batch!.options.every((o) => o.brandLogoId === null)).toBe(true);
    expect(wikiCalls).toBe(0);
  });

  test('the gate: off for everyone, admins for admins only, all for everyone', async () => {
    expect(brandLogosAllowed('member', 'off')).toBe(false);
    expect(brandLogosAllowed('admin', 'off')).toBe(false);
    expect(brandLogosAllowed('member', 'admins')).toBe(false);
    expect(brandLogosAllowed('admin', 'admins')).toBe(true);
    expect(brandLogosAllowed('member', 'all')).toBe(true);

    gate('off');
    expect((await read('Tata Sons rejects Noel Tata objections')).brief.brandLogoId).toBeNull();
    gate('admins');
    expect((await read('Tata Sons rejects Noel Tata objections')).brief.brandLogoId).toBeNull();
    const admin = await read('Tata Sons rejects Noel Tata objections', { actorRole: 'admin' });
    expect(admin.brief.brandLogoId).toBeTruthy();
    expect(admin.batch!.options.filter((o) => o.brandLogoId)).toHaveLength(2);
  });

  test('a garbled logo drives the one redraw, with the note to reproduce it exactly', async () => {
    const { request, batch } = await read('FAKE_LOGO_GARBLED Tata Sons rejects Noel Tata objections');
    let rows = await previews(batch!.id);
    expect(rows[0]).toMatchObject({ state: 'PENDING', logoOk: false, storyRedraws: 1 });
    expect(rows[3]).toMatchObject({ state: 'PREVIEW_READY', logoOk: true, storyRedraws: 0 });
    await runPreview(rows[0]!.id);
    rows = await db.option.findMany({ where: { batchId: batch!.id }, orderBy: { index: 'asc' } });
    expect(rows[0]).toMatchObject({ state: 'PREVIEW_READY', logoOk: true, storyRedraws: 1 });
    expect(sent(rows[0]!).prompt).toContain(LOGO_AGAIN);
    expect(LOGO_AGAIN).toContain('Reproduce the attached logo exactly');
    expect(await db.attempt.count({ where: { requestId: request.id, stage: 'story_redraw', model: { contains: 'image' } } })).toBe(1);
  });

  test('a logo still garbled after the redraw is flagged on the option, never redrawn again', async () => {
    const { request, batch } = await read('FAKE_LOGO_ALWAYS_GARBLED Tata Sons rejects Noel Tata objections');
    let rows = await previews(batch!.id);
    await runPreview(rows[0]!.id);
    await runPreview(rows[0]!.id);
    rows = await db.option.findMany({ where: { batchId: batch!.id }, orderBy: { index: 'asc' } });
    expect(rows.map((o) => o.logoOk)).toEqual([false, null, null, false]);
    expect(rows.map((o) => o.storyRedraws)).toEqual([1, 0, 0, 0]);
    expect(rows.every((o) => o.state === 'PREVIEW_READY')).toBe(true);
    expect(await db.attempt.count({ where: { requestId: request.id, stage: 'story_redraw', model: { contains: 'image' } } })).toBe(1);
    const detail = RequestDetail.parse(await (await fetch(`${base}/requests/${request.publicId}`, { headers: HEADERS })).json());
    expect(detail.batches[0]!.options.filter((o) => o.logoOk === false)).toHaveLength(2);
    // A garbled logo also counts against the option in the order: both logo options come last.
    expect(detail.batches[0]!.options.map((o) => o.index)).toEqual([1, 2, 0, 3]);
  });

  test('the text checks allow the official logo and still flag any other text', async () => {
    const preview = previewTextUser('Example Group');
    expect(preview).toContain('The official Example Group logo or wordmark is allowed on image 1; any other text is not.');
    expect(preview).toContain('"hasText" is true only for writing other than the allowed logo');
    expect(preview).toContain('"allowedLogo"');
    expect(previewTextUser(null)).not.toMatch(/logo/i);
    expect(PreviewTextCheck.parse({ hasText: false, where: '' }).allowedLogo).toBe(false);

    const style = (await styleById((await db.style.findFirstOrThrow({ where: { slug: 'ink-wash' } })).id))!;
    const judge = buildJudgeUser(style, false, 'Example Group');
    expect(judge).toContain('Image 3 is the official Example Group logo');
    expect(judge).toContain('The official Example Group logo or wordmark is allowed; any other text is not.');
    expect(judge).toContain('other than the allowed logo');
    expect(judge).toContain('"allowedLogoSeen": boolean');
    expect(buildJudgeUser(style, false)).not.toContain('allowedLogoSeen');
    const pass = JudgeOutput.parse({ hasText: false, hasLogoOrWatermark: false, anatomyOk: true, matchesPreview: true, onStyle: 4, photorealNewsRisk: false, realPersonLikenessRisk: false, allowedLogoSeen: true, notes: '' });
    expect(judgePasses(pass)).toBe(true);
    // Stray text or another mark beside the allowed logo still fails.
    expect(judgePasses({ ...pass, hasText: true })).toBe(false);
    expect(judgePasses({ ...pass, hasLogoOrWatermark: true })).toBe(false);
  });

  test('the pack credits the logo to its owner', async () => {
    const { brief } = await read('Tata Sons rejects Noel Tata objections');
    const credits = await logoCredits(brief.brandLogoId);
    expect(credits).toEqual(['Logo: Example Group (trademark of its owner), via Wikimedia Commons']);
    expect(withFaceCredits('AI illustration: ET', credits)).toBe('AI illustration: ET. Logo: Example Group (trademark of its owner), via Wikimedia Commons');
    expect(await logoCredits(null)).toEqual([]);
  });
});
