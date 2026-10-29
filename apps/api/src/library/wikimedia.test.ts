import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import sharp from 'sharp';
import { setBinaryFetchForTests } from '../lib/remote-image';
import {
  commonsImage,
  decide,
  downloadCommonsImage,
  licenceAllowed,
  nameScore,
  plainText,
  resolvePerson,
  setWikimediaHttpForTests,
  wikimediaUserAgent,
} from './wikimedia';

/**
 * The resolver against mocked Wikidata and Commons answers, in the shapes the real APIs return
 * (formatversion=2), trimmed to the fields that are read.
 */

interface Fixture {
  id: string;
  label: string;
  hiLabel?: string;
  description?: string;
  aliases?: string[];
  instanceOf?: string[];
  image?: string;
  citizenship?: string[];
  occupation?: string[];
  employer?: string[];
  position?: string[];
  born?: string;
  sitelinks?: number;
}

const item = (id: string) => ({ mainsnak: { snaktype: 'value', datavalue: { value: { 'entity-type': 'item', id }, type: 'wikibase-entityid' } }, rank: 'normal' });

function entity(f: Fixture) {
  const claims: Record<string, unknown[]> = { P31: (f.instanceOf ?? ['Q5']).map(item) };
  if (f.image) claims.P18 = [{ mainsnak: { snaktype: 'value', datavalue: { value: f.image, type: 'string' } }, rank: 'normal' }];
  if (f.citizenship) claims.P27 = f.citizenship.map(item);
  if (f.occupation) claims.P106 = f.occupation.map(item);
  if (f.employer) claims.P108 = f.employer.map(item);
  if (f.position) claims.P39 = f.position.map(item);
  if (f.born) claims.P569 = [{ mainsnak: { snaktype: 'value', datavalue: { value: { time: f.born, precision: 11 }, type: 'time' } }, rank: 'normal' }];
  return {
    type: 'item',
    id: f.id,
    labels: { en: { language: 'en', value: f.label }, ...(f.hiLabel ? { hi: { language: 'hi', value: f.hiLabel } } : {}) },
    descriptions: f.description ? { en: { language: 'en', value: f.description } } : {},
    aliases: { en: (f.aliases ?? []).map((value) => ({ language: 'en', value })) },
    claims,
    sitelinks: Object.fromEntries(Array.from({ length: f.sitelinks ?? 0 }, (_, i) => [`wiki${i}`, { site: `wiki${i}`, title: f.label }])),
  };
}

const PEOPLE: Fixture[] = [
  { id: 'Q100', label: 'Natarajan Chandrasekaran', aliases: ['N. Chandrasekaran', 'Chandra'], description: 'Indian business executive', image: 'N Chandrasekaran 2017.jpg', citizenship: ['Q668'], employer: ['Q900'], position: ['Q901'], born: '+1963-06-02T00:00:00Z', sitelinks: 12 },
  { id: 'Q101', label: 'N. Chandrasekaran', description: 'Indian politician', image: 'Chandrasekaran MLA.jpg', citizenship: ['Q668'], position: ['Q902'], sitelinks: 2 },
  { id: 'Q200', label: 'Rahul Sharma', description: 'Indian actor', image: 'Rahul Sharma actor.jpg', citizenship: ['Q668'], occupation: ['Q910'], sitelinks: 5 },
  { id: 'Q201', label: 'Rahul Sharma', description: 'Indian cricketer', image: 'Rahul Sharma cricketer.jpg', citizenship: ['Q668'], occupation: ['Q911'], sitelinks: 5 },
  { id: 'Q300', label: 'Asha Kid', description: 'Indian child actor', image: 'Asha Kid.jpg', citizenship: ['Q668'], born: `+${new Date().getUTCFullYear() - 12}-01-01T00:00:00Z` },
  { id: 'Q400', label: 'Meera Nophoto', description: 'Indian banker', citizenship: ['Q668'] },
  { id: 'Q500', label: 'Ratan Tata', hiLabel: 'रतन टाटा', description: 'Indian industrialist', aliases: ['Ratan Naval Tata'], image: 'Ratan Tata photo.jpg', citizenship: ['Q668'], employer: ['Q900'], sitelinks: 40 },
];
const THINGS: Fixture[] = [
  { id: 'Q900', label: 'Tata Sons', instanceOf: ['Q4830453'], description: 'Indian holding company' },
  { id: 'Q901', label: 'chairperson', instanceOf: ['Q4164871'] },
  { id: 'Q902', label: 'member of the Tamil Nadu Legislative Assembly', instanceOf: ['Q4164871'] },
  { id: 'Q910', label: 'actor', instanceOf: ['Q28640'] },
  { id: 'Q911', label: 'cricketer', instanceOf: ['Q28640'] },
];
const ALL = [...PEOPLE, ...THINGS];

/** Which ids a search for a name returns, in order. */
const SEARCH: Record<string, string[]> = {
  'N. Chandrasekaran': ['Q101', 'Q100'],
  'Rahul Sharma': ['Q200', 'Q201'],
  'Tata Sons': ['Q900'],
  'Asha Kid': ['Q300'],
  'Meera Nophoto': ['Q400'],
  'Ratan Tata': ['Q500', 'Q900'],
  'रतन टाटा': ['Q500'],
};

const COMMONS: Record<string, object> = {
  'File:N Chandrasekaran 2017.jpg': {
    thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/N_Chandrasekaran_2017.jpg/1024px-N_Chandrasekaran_2017.jpg',
    thumbwidth: 1024,
    thumbheight: 1365,
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/N_Chandrasekaran_2017.jpg',
    descriptionurl: 'https://commons.wikimedia.org/wiki/File:N_Chandrasekaran_2017.jpg',
    extmetadata: {
      LicenseShortName: { value: 'CC BY-SA 4.0', source: 'commons-desc-page' },
      LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0' },
      Artist: { value: '<a href="//commons.wikimedia.org/wiki/User:Jane_Doe" title="User:Jane Doe">Jane Doe</a> &amp; WEF' },
      Credit: { value: '<span class="int-own-work" lang="en">Own work</span>' },
      AttributionRequired: { value: 'true' },
      Restrictions: { value: 'personality' },
    },
  },
  'File:Ratan Tata photo.jpg': {
    thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Ratan_Tata_photo.jpg/1024px-Ratan_Tata_photo.jpg',
    thumbwidth: 1024,
    thumbheight: 1024,
    descriptionurl: '//commons.wikimedia.org/wiki/File:Ratan_Tata_photo.jpg',
    extmetadata: { LicenseShortName: { value: 'GFDL' }, Artist: { value: 'Someone' } },
  },
  'File:Rahul Sharma actor.jpg': {
    thumburl: 'https://example.org/not-commons.jpg',
    descriptionurl: 'https://commons.wikimedia.org/wiki/File:Rahul_Sharma_actor.jpg',
    extmetadata: { LicenseShortName: { value: 'CC BY 3.0' }, Artist: { value: 'A' } },
  },
};

const calls: Record<string, string>[] = [];
let failNext = false;

async function fakeHttp(url: string, params: Record<string, string>): Promise<unknown> {
  calls.push({ url, ...params });
  if (failNext) {
    failNext = false;
    throw new Error('connect ETIMEDOUT');
  }
  if (params.action === 'wbsearchentities') {
    const ids = SEARCH[params.search!] ?? [];
    return { searchinfo: { search: params.search }, search: ids.map((id) => ({ id, label: ALL.find((f) => f.id === id)!.label, match: { type: 'label', language: params.language, text: params.search } })), success: 1 };
  }
  if (params.action === 'wbgetentities') {
    const ids = params.ids!.split('|');
    return { entities: Object.fromEntries(ids.map((id) => [id, ALL.find((f) => f.id === id) ? entity(ALL.find((f) => f.id === id)!) : { id, missing: '' }])), success: 1 };
  }
  if (params.action === 'query') {
    const info = COMMONS[params.titles!];
    return { batchcomplete: true, query: { pages: [info ? { ns: 6, title: params.titles, imagerepository: 'local', imageinfo: [info] } : { ns: 6, title: params.titles, missing: true }] } };
  }
  throw new Error(`unexpected call ${JSON.stringify(params)}`);
}

beforeEach(() => {
  setWikimediaHttpForTests(fakeHttp);
  calls.length = 0;
  failNext = false;
});
afterAll(() => {
  setWikimediaHttpForTests();
  setBinaryFetchForTests();
});

describe('name matching', () => {
  test('an exact label beats an alias, which beats initials; honorifics and dots are ignored', () => {
    const person = { label: 'Natarajan Chandrasekaran', aliases: ['N. Chandrasekaran'] };
    expect(nameScore('Natarajan Chandrasekaran', person)).toBe(0.45);
    expect(nameScore('Mr N. Chandrasekaran', person)).toBe(0.35);
    expect(nameScore('N Chandrasekaran', { label: 'Natarajan Chandrasekaran', aliases: [] })).toBe(0.3);
    expect(nameScore('Chandrasekaran', person)).toBe(0.2);
    expect(nameScore('Somebody Else', person)).toBe(0.05);
  });

  test('a best match needs a good score and a clear lead', () => {
    const c = (wikidataId: string, score: number) => ({ wikidataId, label: wikidataId, description: '', imageFile: 'x.jpg', score });
    expect(decide([c('Q1', 0.8), c('Q2', 0.6)])?.best.wikidataId).toBe('Q1');
    expect(decide([c('Q1', 0.8), c('Q2', 0.6)])?.alternatives.map((a) => a.wikidataId)).toEqual(['Q2']);
    expect(decide([c('Q1', 0.8), c('Q2', 0.7)])).toBeNull();
    expect(decide([c('Q1', 0.45)])).toBeNull();
    expect(decide([])).toBeNull();
  });
});

describe('resolvePerson', () => {
  test('the company and role in the story pick the executive over a namesake politician', async () => {
    const r = await resolvePerson('N. Chandrasekaran', { orgs: ['Tata Sons', 'Tata Group'], role: 'chairman of Tata Sons', india: true });
    expect(r?.best.wikidataId).toBe('Q100');
    expect(r?.best.label).toBe('Natarajan Chandrasekaran');
    expect(r?.best.imageFile).toBe('N Chandrasekaran 2017.jpg');
    expect(r?.alternatives.map((a) => a.wikidataId)).toEqual(['Q101']);
    const search = calls.find((c) => c.action === 'wbsearchentities')!;
    expect(search).toMatchObject({ url: 'https://www.wikidata.org/w/api.php', search: 'N. Chandrasekaran', language: 'en', type: 'item' });
    const get = calls.find((c) => c.action === 'wbgetentities' && c.props?.includes('claims'))!;
    expect(get.props).toContain('sitelinks');
  });

  test('without context the same name is too close to call: unsure is null', async () => {
    expect(await resolvePerson('N. Chandrasekaran', { india: true })).toBeNull();
  });

  test('two equally likely people of one name are null', async () => {
    expect(await resolvePerson('Rahul Sharma', { orgs: ['Example Corp'], india: true })).toBeNull();
  });

  test('a role can settle namesakes when it names what one of them is', async () => {
    const r = await resolvePerson('Rahul Sharma', { role: 'cricketer, Mumbai Indians', orgs: ['Mumbai Indians'], india: true });
    // One role word is not enough of a lead on its own.
    expect(r).toBeNull();
  });

  test('only humans with an image, never a minor', async () => {
    expect(await resolvePerson('Tata Sons', { india: true })).toBeNull();
    expect(await resolvePerson('Meera Nophoto', { india: true })).toBeNull();
    expect(await resolvePerson('Asha Kid', { india: true })).toBeNull();
  });

  test('a name in Devanagari is searched in Hindi first', async () => {
    const r = await resolvePerson('रतन टाटा', { india: true });
    expect(r?.best.wikidataId).toBe('Q500');
    expect(calls.filter((c) => c.action === 'wbsearchentities').map((c) => c.language)).toEqual(['hi', 'en']);
  });

  test('answers are cached by name and context', async () => {
    await resolvePerson('Ratan Tata', { orgs: ['Tata Sons'], india: true });
    const first = calls.length;
    await resolvePerson('Mr Ratan Tata', { orgs: ['Tata Sons'], india: true });
    expect(calls.length).toBe(first);
    await resolvePerson('Ratan Tata', { orgs: ['Tata Motors'], india: true });
    expect(calls.length).toBeGreaterThan(first);
  });

  test('network trouble is null, and is not cached', async () => {
    failNext = true;
    expect(await resolvePerson('Ratan Tata', { india: true })).toBeNull();
    expect((await resolvePerson('Ratan Tata', { india: true }))?.best.wikidataId).toBe('Q500');
  });
});

describe('Commons', () => {
  test('a freely licensed file gives its thumbnail, licence, author and page', async () => {
    const image = await commonsImage('N Chandrasekaran 2017.jpg');
    expect(image).toEqual({
      thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/N_Chandrasekaran_2017.jpg/1024px-N_Chandrasekaran_2017.jpg',
      width: 1024,
      height: 1365,
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      author: 'Jane Doe & WEF',
      pageUrl: 'https://commons.wikimedia.org/wiki/File:N_Chandrasekaran_2017.jpg',
    });
    const q = calls.find((c) => c.action === 'query')!;
    expect(q).toMatchObject({ url: 'https://commons.wikimedia.org/w/api.php', titles: 'File:N Chandrasekaran 2017.jpg', prop: 'imageinfo', iiprop: 'url|extmetadata|size', iiurlwidth: '1024' });
  });

  test('a GFDL-only file, a file off Commons and a missing file are refused', async () => {
    expect(await commonsImage('Ratan Tata photo.jpg')).toBeNull();
    expect(await commonsImage('Rahul Sharma actor.jpg')).toBeNull();
    expect(await commonsImage('Nothing here.jpg')).toBeNull();
  });

  test('licences: CC0, public domain and CC BY or BY-SA only', () => {
    for (const ok of ['CC BY-SA 4.0', 'CC BY 2.0', 'CC BY-SA 3.0 igo', 'CC0', 'Public domain', 'PD-US']) expect(licenceAllowed(ok)).toBe(true);
    for (const no of ['GFDL', 'CC BY-NC 4.0', 'CC BY-ND 4.0', 'Fair use', '', 'All rights reserved']) expect(licenceAllowed(no)).toBe(false);
  });

  test('credits are plain text', () => {
    expect(plainText('<a href="x">Jane</a>&nbsp;Doe')).toBe('Jane Doe');
    expect(plainText(undefined)).toBe('');
  });

  test('downloads only from upload.wikimedia.org, with the contact User-Agent', async () => {
    const jpeg = await sharp({ create: { width: 300, height: 400, channels: 3, background: '#887766' } }).jpeg().toBuffer();
    let headers: Record<string, string> = {};
    setBinaryFetchForTests(async (_url, opts) => {
      headers = opts.headers;
      return jpeg;
    });
    const image = await downloadCommonsImage('https://upload.wikimedia.org/wikipedia/commons/a/ab/x.jpg');
    expect(image.width).toBe(300);
    expect(headers['User-Agent']).toBe(wikimediaUserAgent());
    expect(wikimediaUserAgent()).toMatch(/^ETArticlesArt\/[\d.]+ \(.+\)/);
    await expect(downloadCommonsImage('https://example.org/x.jpg')).rejects.toThrow('not one this service fetches from');
  });
});
