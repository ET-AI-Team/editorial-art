import { realFacesAllowedFor } from './guard/sensitivity';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { PeopleResponse, RequestDetail, type SentImageCall } from '@editorial-art/shared-types';
import sharp from 'sharp';
import { ADMIN, ARTICLE, MEMBER, call, liveLibrary, startHarness, until, type Harness } from '../../test/harness';
import { db } from '../lib/db';
import { resetEnvForTests } from '../lib/env';
import { realPeopleAllowed } from '../lib/real-people';
import { setBinaryFetchForTests } from '../lib/remote-image';
import { styleById } from '../library/styles';
import { setWikimediaHttpForTests } from '../library/wikimedia';
import { checkLikeness, LIKENESS_AGAIN, likenessStyle, realLikenessClause, WeakLikeness } from './likeness-check';
import { peopleToConfirm, realFacesAllowedAt, realFacesNote, releaseWhenGateCloses, withFaceCredits } from './people';

/**
 * Real faces end to end, with fake image models and a mocked Wikidata and Commons: the gate, the
 * pause before the first previews, each decision, the face-match redraw and the pack credit.
 *
 * The fake read finds one public figure, "Asha Rao" (FAKE_PERSON), in every direction. The live
 * styles are still-life (photoreal), watercolour and charcoal, so without a chosen style the first
 * batch is still-life, watercolour, charcoal, still-life: faces only in options 1 and 2.
 */

let h: Harness;
let styles: Map<string, string>;
let day = 0;

function gate(mode: 'off' | 'admins' | 'all'): void {
  process.env.EA_REAL_PEOPLE = mode;
  resetEnvForTests();
}

// ---- mocked Wikimedia ----------------------------------------------------------------------

const item = (id: string) => ({ mainsnak: { snaktype: 'value', datavalue: { value: { id } } }, rank: 'normal' });
const human = (id: string, description: string, image: string, related: Record<string, string[]>) => ({
  id,
  labels: { en: { value: 'Asha Rao' } },
  descriptions: { en: { value: description } },
  aliases: {},
  claims: {
    P31: [item('Q5')],
    P18: [{ mainsnak: { snaktype: 'value', datavalue: { value: image } }, rank: 'normal' }],
    P27: [item('Q668')],
    ...Object.fromEntries(Object.entries(related).map(([p, ids]) => [p, ids.map(item)])),
  },
  sitelinks: {},
});
const ENTITIES: Record<string, object> = {
  Q1001: human('Q1001', 'Indian business executive', 'Asha Rao 2019.jpg', { P108: ['Q2001'] }),
  Q1002: human('Q1002', 'Indian cricketer', 'Asha Rao cricket.jpg', { P106: ['Q3001'] }),
  Q2001: { id: 'Q2001', labels: { en: { value: 'Example Group' } } },
  Q3001: { id: 'Q3001', labels: { en: { value: 'cricketer' } } },
};
const FILES: Record<string, { licence: string; artist: string }> = {
  'File:Asha Rao 2019.jpg': { licence: 'CC BY-SA 4.0', artist: '<a href="//commons.wikimedia.org/wiki/User:Jane">Jane Photographer</a>' },
  'File:Asha Rao cricket.jpg': { licence: 'CC BY 2.0', artist: 'Raj Photographer' },
};
const wikiCalls: Record<string, string>[] = [];

async function wiki(_url: string, params: Record<string, string>): Promise<unknown> {
  wikiCalls.push(params);
  if (params.action === 'wbsearchentities') return { search: params.search === 'Asha Rao' ? [{ id: 'Q1001' }, { id: 'Q1002' }] : [] };
  if (params.action === 'wbgetentities') return { entities: Object.fromEntries(params.ids!.split('|').map((id) => [id, ENTITIES[id] ?? { id, missing: '' }])) };
  const file = FILES[params.titles!];
  const slug = params.titles!.replace(/\W+/g, '_');
  return {
    query: {
      pages: [
        file
          ? {
              imageinfo: [
                {
                  thumburl: `https://upload.wikimedia.org/wikipedia/commons/thumb/${slug}/1024px-${slug}`,
                  thumbwidth: 800,
                  thumbheight: 1000,
                  descriptionurl: `https://commons.wikimedia.org/wiki/${slug}`,
                  extmetadata: { LicenseShortName: { value: file.licence }, Artist: { value: file.artist } },
                },
              ],
            }
          : { missing: true },
      ],
    },
  };
}

// ---- helpers -------------------------------------------------------------------------------

async function create(headers: Record<string, string>, body: Record<string, unknown> = {}): Promise<string> {
  const res = await call(h.base, '/requests', { method: 'POST', headers, body: { articleText: ARTICLE.replace('Monday', `day ${++day}`), prompt: 'Keep it dignified FAKE_PERSON', ...body } });
  expect(res.status).toBe(202);
  return res.json.requestId as string;
}

const row = (publicId: string) => db.request.findUniqueOrThrow({ where: { publicId } });

async function waitStatus(publicId: string, statuses: string[]): Promise<void> {
  await until(async () => statuses.includes((await row(publicId)).status));
}

async function settled(publicId: string, seq = 1): Promise<void> {
  await until(async () => {
    const r = await db.request.findUniqueOrThrow({ where: { publicId }, include: { batches: true } });
    const b = r.batches.find((x) => x.seq === seq);
    return !!b && ['READY', 'PARTIAL', 'FAILED'].includes(b.status);
  });
}

async function options(publicId: string) {
  const r = await row(publicId);
  return db.option.findMany({ where: { requestId: r.id }, orderBy: { index: 'asc' } });
}

const sentPrompt = (o: { previewInput: unknown }) => (o.previewInput as SentImageCall).prompt;
const sentRoles = (o: { previewInput: unknown }) => (o.previewInput as SentImageCall).images.map((i) => i.role);

async function people(publicId: string, headers = ADMIN) {
  const res = await call(h.base, `/requests/${publicId}/people`, { headers });
  return { status: res.status, json: res.json };
}

async function decide(publicId: string, likenessId: string, body: Record<string, unknown>, headers = ADMIN) {
  return call(h.base, `/requests/${publicId}/people/${likenessId}/decision`, { method: 'POST', headers, body });
}

async function activeLikeness(name = 'Asha Rao') {
  return db.likeness.create({
    data: { name, aliases: [], photos: [{ url: 'https://res.cloudinary.com/fake/image/upload/v1/test/asha.webp', publicId: 'test/asha', width: 800, height: 1000 }], consentNote: 'Test likeness, consent on file.', approvedBy: 'test' },
  });
}

const imageCalls = () => h.fake.calls.filter((c) => c.kind.startsWith('image:')).length;

beforeAll(async () => {
  h = await startHarness();
  styles = await liveLibrary(['still-life', 'watercolour', 'charcoal', 'ink-wash']);
  setWikimediaHttpForTests(wiki);
  const jpeg = await sharp({ create: { width: 400, height: 500, channels: 3, background: '#a08070' } }).jpeg().toBuffer();
  setBinaryFetchForTests(async () => jpeg);
});

afterAll(async () => {
  delete process.env.EA_REAL_PEOPLE;
  resetEnvForTests();
  setWikimediaHttpForTests();
  setBinaryFetchForTests();
  await h.stop();
});

beforeEach(async () => {
  await db.requestPerson.deleteMany();
  await db.likeness.deleteMany();
  wikiCalls.length = 0;
});

// ---- pure rules ----------------------------------------------------------------------------

describe('rules', () => {
  test('the gate: off lets nobody, admins only admins, all everyone', () => {
    expect([realPeopleAllowed('admin', 'off'), realPeopleAllowed('member', 'off')]).toEqual([false, false]);
    expect([realPeopleAllowed('admin', 'admins'), realPeopleAllowed('member', 'admins')]).toEqual([true, false]);
    expect([realPeopleAllowed('admin', 'all'), realPeopleAllowed('member', 'all')]).toEqual([true, true]);
  });

  test('the read hears about real faces only when the gate lets the actor have them', () => {
    gate('admins');
    expect(realFacesNote('member')).toBe('');
    expect(realFacesNote('admin')).toContain('REAL FACES');
    gate('off');
    expect(realFacesNote('admin')).toBe('');
  });

  test('faces are blocked on sensitive stories, courts and arrests included', () => {
    expect(['NONE', 'ELEVATED', 'HIGH', 'BLOCKED', null].map((l) => realFacesAllowedAt(l as never))).toEqual([true, false, false, false, false]);
  });

  test('faces only in illustrated, non-satire styles on stories with no sensitivity', () => {
    const style = (slug: string, safety: Partial<{ allowsPeople: boolean; allowsRealPeople: boolean; photoreal: boolean }> = {}) => ({ slug, safety: { allowsPeople: true, allowsRealPeople: true, photoreal: false, ...safety } });
    expect(realFacesAllowedFor(style('gouache'), 'NONE')).toBe(true);
    expect(realFacesAllowedFor(style('gouache'), 'ELEVATED')).toBe(false);
    expect(realFacesAllowedFor(style('editorial-cartoon'), 'NONE')).toBe(false);
    expect(realFacesAllowedFor(style('kalighat'), 'NONE')).toBe(false);
    expect(realFacesAllowedFor(style('still-life', { photoreal: true, allowsRealPeople: false }), 'NONE')).toBe(false);
    expect(realFacesAllowedFor(style('watercolour', { allowsRealPeople: false }), 'NONE')).toBe(false);
  });

  test('only public adults drawn with a face in the first batch are confirmed', () => {
    const d = (id: string, rank: number, styleId: string, names: string[]) => ({ id, rank, suggestedStyleId: styleId, peopleDepicted: names.map((name) => ({ name, how: 'illustrated' as const, likenessId: null })) });
    const directions = [d('d1', 1, 'paint', ['Asha Rao', 'Kid Rao']), d('d2', 2, 'photo', ['Ravi Iyer']), d('d3', 3, 'paint', ['Meena Das', 'Joe Public'])];
    const peopleList = [
      { name: 'Asha Rao', isPublicFigure: true, isMinor: false },
      { name: 'Kid Rao', isPublicFigure: true, isMinor: true },
      { name: 'Ravi Iyer', isPublicFigure: true, isMinor: false },
      { name: 'Meena Das', isPublicFigure: true, isMinor: false },
      { name: 'Joe Public', isPublicFigure: false, isMinor: false },
    ];
    const names = (requestStyleId: string | null, realPeopleStyles: string[]) =>
      peopleToConfirm({ directions, requestStyleId, realPeopleStyles: new Set(realPeopleStyles), people: peopleList }).map((p) => p.name);
    expect(names(null, ['paint'])).toEqual(['Asha Rao', 'Meena Das']);
    // A chosen style uses directions 1 and 2 only.
    expect(names('paint', ['paint'])).toEqual(['Asha Rao', 'Ravi Iyer']);
    expect(names(null, [])).toEqual([]);
  });

  test('the likeness clause asks for a respectful, recognisable likeness and the style negatives stop fighting it', async () => {
    const clause = realLikenessClause(['Asha Rao']);
    expect(clause).toContain('show Asha Rao as illustrated figures');
    expect(clause).toContain('a respectful, recognisable likeness');
    expect(clause).toContain('mild stylisation true to the style');
    expect(clause).toContain('Never mocking, caricatured or exaggerated unless the editor asks');
    const style = (await styleById(styles.get('ink-wash')!))!;
    const withNegatives = { ...style, ruleSheet: { ...style.ruleSheet, negative: 'text, caricature, real person likeness, celebrity likeness, portraits' } };
    expect(likenessStyle(withNegatives, ['Asha Rao']).ruleSheet.negative).toBe('text, caricature');
    expect(likenessStyle(withNegatives, [])).toBe(withNegatives);
  });

  test('the pack credit names the Commons author and licence', () => {
    expect(withFaceCredits('AI illustration: ET', [])).toBe('AI illustration: ET');
    expect(withFaceCredits('AI illustration: ET.', ['Face reference: Jane, Wikimedia Commons, CC BY-SA 4.0'])).toBe('AI illustration: ET. Face reference: Jane, Wikimedia Commons, CC BY-SA 4.0');
  });
});

describe('the face-match check', () => {
  test('weak on the first pass asks for a redraw; weak on the last pass flags; good passes; a failed check passes', async () => {
    const img = await sharp({ create: { width: 64, height: 64, channels: 3, background: '#777' } }).png().toBuffer();
    const photos = [{ buffer: img, mimeType: 'image/png' }];
    const original = h.fake.chatJson;
    const request = await db.request.create({
      data: { publicId: 'ear_likenessCheckTest000000', callerKeyId: 'test', actorUserId: ADMIN['x-actor-user-id'], actorWorkspaceId: ADMIN['x-actor-workspace-id'], articleHash: 'x', articleChars: 1, articleExcerpt: 'x', spendCapInr: 200, expiresAt: new Date(Date.now() + 86_400_000) },
    });
    const ids = { requestId: request.id, optionId: '00000000-0000-4000-8000-000000000002' };
    try {
      h.fake.chatJson = async (p) => (p.kind === 'likeness_check' ? { json: { likeness: 'weak', notes: 'different jaw' }, usage: null, model: p.model } : original(p));
      await expect(checkLikeness(ids, ['Asha Rao'], img, photos, false)).rejects.toBeInstanceOf(WeakLikeness);
      expect(await checkLikeness(ids, ['Asha Rao'], img, photos, true)).toBe(true);
      expect(await checkLikeness(ids, [], img, photos, true)).toBe(false);
      h.fake.chatJson = async (p) => (p.kind === 'likeness_check' ? { json: { likeness: 'good' }, usage: null, model: p.model } : original(p));
      expect(await checkLikeness(ids, ['Asha Rao'], img, photos, false)).toBe(false);
      h.fake.chatJson = async (p) => (p.kind === 'likeness_check' ? { json: { likeness: 'maybe' }, usage: null, model: p.model } : original(p));
      expect(await checkLikeness(ids, ['Asha Rao'], img, photos, false)).toBe(false);
    } finally {
      h.fake.chatJson = original;
    }
    const attempt = await db.attempt.findFirst({ where: { stage: 'likeness_check' } });
    expect(attempt?.model).toBe('gpt-4.1');
  });
});

// ---- the gate ------------------------------------------------------------------------------

describe('the gate', () => {
  test('off: even an admin never pauses, nothing is looked up, nobody gets a face', async () => {
    gate('off');
    await activeLikeness();
    const id = await create(ADMIN);
    await settled(id);
    expect((await row(id)).status).toBe('ACTIVE');
    expect(wikiCalls).toHaveLength(0);
    for (const o of await options(id)) {
      expect(o.likenessIds).toEqual([]);
      expect(sentRoles(o)).not.toContain('likeness');
    }
    expect((await people(id)).status).toBe(403);
  });

  test('admins: a member never pauses and never gets a face, even with a likeness on file', async () => {
    gate('admins');
    await activeLikeness();
    const id = await create(MEMBER);
    await settled(id);
    expect((await row(id)).status).toBe('ACTIVE');
    expect(wikiCalls).toHaveLength(0);
    for (const o of await options(id)) {
      expect(o.likenessIds).toEqual([]);
      expect(sentRoles(o)).not.toContain('likeness');
    }
    expect(sentPrompt((await options(id))[1]!)).toContain("do not show anyone's face");
    const res = await people(id, MEMBER);
    expect(res.status).toBe(403);
    expect(res.json.error?.code).toBe('FORBIDDEN');
  });

  test('admins: a person already ACTIVE skips the pause; photoreal options never get the face', async () => {
    gate('admins');
    const likeness = await activeLikeness();
    const id = await create(ADMIN);
    await settled(id);
    expect(wikiCalls).toHaveLength(0);
    const opts = await options(id);
    expect(opts.map((o) => o.likenessIds)).toEqual([[], [likeness.id], [likeness.id], []]);
    expect(sentRoles(opts[1]!)).toContain('likeness');
    expect(sentPrompt(opts[1]!)).toContain('a respectful, recognisable likeness');
    expect(sentPrompt(opts[0]!)).toContain('no people at all');
  });

  test('a member asking for more on a request with faces gets none once the gate excludes them', async () => {
    gate('all');
    const likeness = await activeLikeness();
    const id = await create(MEMBER);
    await settled(id);
    expect((await options(id))[1]!.likenessIds).toEqual([likeness.id]);
    gate('admins');
    const more = await call(h.base, `/requests/${id}/batches`, { method: 'POST', headers: MEMBER, body: { kind: 'MORE' } });
    expect(more.status).toBe(202);
    await settled(id, 2);
    const second = (await options(id)).filter((o) => o.batchId === more.json.batchId);
    expect(second.every((o) => o.likenessIds.length === 0)).toBe(true);
  });
});

// ---- the pause and the decisions -----------------------------------------------------------

describe('confirming people', () => {
  test('a photoreal style never pauses and never draws a face', async () => {
    gate('all');
    const id = await create(ADMIN, { styleId: styles.get('still-life') });
    await settled(id);
    expect(wikiCalls).toHaveLength(0);
    for (const o of await options(id)) expect(o.likenessIds).toEqual([]);
  });

  test('a sensitive story never pauses', async () => {
    gate('all');
    const id = await create(ADMIN, { prompt: 'Keep it dignified FAKE_PERSON FAKE_HIGH' });
    await settled(id);
    expect((await row(id)).sensitivity).toBe('HIGH');
    expect(wikiCalls).toHaveLength(0);
    for (const o of await options(id)) expect(o.likenessIds).toEqual([]);
  });

  test('admin: pauses with the Commons match; try another; use; the pipeline resumes and the pack credits the photo', async () => {
    gate('admins');
    const id = await create(ADMIN);
    await waitStatus(id, ['NEEDS_PEOPLE_CONFIRM', 'ACTIVE', 'FAILED']);
    expect((await row(id)).status).toBe('NEEDS_PEOPLE_CONFIRM');
    expect(await db.batch.count({ where: { requestId: (await row(id)).id } })).toBe(0);
    const detail = RequestDetail.parse((await call(h.base, `/requests/${id}`, { headers: ADMIN })).json);
    expect(detail.status).toBe('NEEDS_PEOPLE_CONFIRM');
    expect(detail.directions).toHaveLength(3);

    let list = PeopleResponse.parse((await people(id)).json);
    expect(list.waiting).toBe(true);
    expect(list.people).toHaveLength(1);
    const first = list.people[0]!;
    expect(first).toMatchObject({
      name: 'Asha Rao',
      label: 'Asha Rao',
      description: 'Indian business executive',
      source: 'WIKIMEDIA',
      sourceLine: 'Wikimedia Commons, CC BY-SA 4.0',
      author: 'Jane Photographer',
      decision: 'PENDING',
      canSwap: true,
    });
    expect(first.photoUrl).toMatch(/^https:\/\/res\.cloudinary\.com\/fake\/.*\/likeness\//);
    const candidate = await db.likeness.findUniqueOrThrow({ where: { id: first.likenessId } });
    expect(candidate).toMatchObject({ status: 'CANDIDATE', wikidataId: 'Q1001', licence: 'CC BY-SA 4.0', commonsPage: 'https://commons.wikimedia.org/wiki/File_Asha_Rao_2019_jpg' });

    // Try another: the namesake, credited to its own photographer.
    const swapped = await decide(id, first.likenessId, { action: 'swap' });
    expect(swapped.status).toBe(200);
    list = PeopleResponse.parse(swapped.json);
    const second = list.people[0]!;
    expect(second.likenessId).not.toBe(first.likenessId);
    expect(second).toMatchObject({ description: 'Indian cricketer', sourceLine: 'Wikimedia Commons, CC BY 2.0', author: 'Raj Photographer', canSwap: false });
    const none = await decide(id, second.likenessId, { action: 'swap' });
    expect(none.status).toBe(409);
    expect(none.json.error?.code).toBe('NO_OTHER_MATCH');
    // The old likeness id no longer names anyone in this request.
    expect((await decide(id, first.likenessId, { action: 'use' })).status).toBe(404);

    const used = await decide(id, second.likenessId, { action: 'use' });
    expect(used.status).toBe(200);
    expect(PeopleResponse.parse(used.json).people[0]!.decision).toBe('USE');
    expect((await db.likeness.findUniqueOrThrow({ where: { id: second.likenessId } })).status).toBe('ACTIVE');

    await settled(id);
    expect(['ACTIVE', 'HAS_FINAL']).toContain((await row(id)).status);
    const opts = await options(id);
    expect(opts.map((o) => o.likenessIds)).toEqual([[], [second.likenessId], [second.likenessId], []]);
    expect(sentRoles(opts[1]!)).toContain('likeness');

    // A decision once the request has moved on is refused.
    expect((await decide(id, second.likenessId, { action: 'symbolic' })).status).toBe(409);

    const fin = await call(h.base, `/options/${opts[1]!.id}/finalize`, { method: 'POST', headers: ADMIN });
    expect(fin.status).toBe(202);
    await until(async () => (await db.option.findUniqueOrThrow({ where: { id: opts[1]!.id } })).state === 'PACK_READY');
    const pack = await call(h.base, `/options/${opts[1]!.id}/pack`, { headers: ADMIN });
    expect(pack.json.credit).toBe('AI illustration: ET. Face reference: Raj Photographer, Wikimedia Commons, CC BY 2.0');
  });

  test('all: a member pauses too; "show without face" resumes with everyone symbolic', async () => {
    gate('all');
    const id = await create(MEMBER);
    await waitStatus(id, ['NEEDS_PEOPLE_CONFIRM', 'ACTIVE', 'FAILED']);
    expect((await row(id)).status).toBe('NEEDS_PEOPLE_CONFIRM');
    const list = PeopleResponse.parse((await people(id, MEMBER)).json);
    const res = await decide(id, list.people[0]!.likenessId, { action: 'symbolic' }, MEMBER);
    expect(res.status).toBe(200);
    expect(PeopleResponse.parse(res.json).people[0]!.decision).toBe('SYMBOLIC');
    await settled(id);
    const opts = await options(id);
    for (const o of opts) expect(o.likenessIds).toEqual([]);
    expect(sentPrompt(opts[1]!)).toContain("do not show anyone's face");
    expect((await db.likeness.findUniqueOrThrow({ where: { id: list.people[0]!.likenessId } })).status).toBe('CANDIDATE');
  });

  test('upload own: only an image from AI Studio\'s Cloudinary, which becomes an ACTIVE upload likeness', async () => {
    gate('admins');
    const id = await create(ADMIN);
    await waitStatus(id, ['NEEDS_PEOPLE_CONFIRM', 'ACTIVE', 'FAILED']);
    const list = PeopleResponse.parse((await people(id)).json);
    const likenessId = list.people[0]!.likenessId;
    expect((await decide(id, likenessId, { action: 'upload' })).status).toBe(400);
    const bad = await decide(id, likenessId, { action: 'upload', url: 'https://example.com/photo.jpg' });
    expect(bad.status).toBe(400);
    expect(bad.json.error?.code).toBe('UPLOAD_INVALID');
    const ok = await decide(id, likenessId, { action: 'upload', url: 'https://res.cloudinary.com/aistudio/image/upload/v1/ui-wrapper/articles/asha.jpg' });
    expect(ok.status).toBe(200);
    const card = PeopleResponse.parse(ok.json).people[0]!;
    expect(card).toMatchObject({ decision: 'UPLOAD', source: 'UPLOAD', sourceLine: null, label: 'Asha Rao' });
    const uploaded = await db.likeness.findUniqueOrThrow({ where: { id: card.likenessId } });
    expect(uploaded).toMatchObject({ status: 'ACTIVE', source: 'UPLOAD', approvedBy: ADMIN['x-actor-user-id'] });
    await settled(id);
    expect((await options(id))[1]!.likenessIds).toEqual([card.likenessId]);
  });

  test('closing the gate releases a waiting request: it carries on with no faces', async () => {
    gate('admins');
    const id = await create(ADMIN);
    await waitStatus(id, ['NEEDS_PEOPLE_CONFIRM', 'ACTIVE', 'FAILED']);
    expect((await row(id)).status).toBe('NEEDS_PEOPLE_CONFIRM');
    gate('off');
    expect(await releaseWhenGateCloses()).toBe(1);
    await settled(id);
    for (const o of await options(id)) expect(o.likenessIds).toEqual([]);
    expect((await db.requestPerson.findFirstOrThrow({ where: { requestId: (await row(id)).id } })).decision).toBe('SYMBOLIC');
  });

  test('cancelling a waiting request works', async () => {
    gate('admins');
    const id = await create(ADMIN);
    await waitStatus(id, ['NEEDS_PEOPLE_CONFIRM', 'ACTIVE', 'FAILED']);
    const res = await call(h.base, `/requests/${id}/cancel`, { method: 'POST', headers: ADMIN });
    expect(res.status).toBe(200);
    expect((await row(id)).status).toBe('CANCELLED');
  });
});

// ---- the face-match redraw in the pipeline -------------------------------------------------

describe('a weak likeness', () => {
  test('is redrawn once, then kept and flagged', async () => {
    gate('admins');
    await activeLikeness();
    const original = h.fake.chatJson;
    h.fake.chatJson = async (p) => (p.kind === 'likeness_check' ? { json: { likeness: 'weak', notes: 'not like the photos' }, usage: null, model: p.model } : original(p));
    try {
      const before = imageCalls();
      const id = await create(ADMIN, { styleId: styles.get('ink-wash') });
      await settled(id);
      const opts = await options(id);
      expect(opts.every((o) => o.state === 'PREVIEW_READY')).toBe(true);
      // Four options, each drawn twice: once, and once more after the weak check.
      expect(imageCalls() - before).toBe(8);
      expect(opts.every((o) => o.likenessWeak)).toBe(true);
      expect(sentPrompt(opts[0]!)).toContain(LIKENESS_AGAIN);
      const detail = RequestDetail.parse((await call(h.base, `/requests/${id}`, { headers: ADMIN })).json);
      expect(detail.batches[0]!.options.every((o) => o.likenessWeak)).toBe(true);
    } finally {
      h.fake.chatJson = original;
    }
  });

  test('a good likeness is drawn once and not flagged', async () => {
    gate('admins');
    await activeLikeness();
    const before = imageCalls();
    const id = await create(ADMIN, { styleId: styles.get('ink-wash') });
    await settled(id);
    expect(imageCalls() - before).toBe(4);
    expect((await options(id)).some((o) => o.likenessWeak)).toBe(false);
  });
});
