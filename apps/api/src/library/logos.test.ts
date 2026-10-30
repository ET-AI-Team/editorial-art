import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import sharp from 'sharp';
import { resetDb } from '../../test/db';
import { db } from '../lib/db';
import { setBinaryFetchForTests } from '../lib/remote-image';
import { setProviders } from '../providers';
import { createFakeProviders } from '../providers/fake/fake-providers';
import { brandLogoFor, resolveBrand } from './logos';
import { licenceAllowed, setWikimediaHttpForTests } from './wikimedia';

/**
 * Finding a brand's official logo against mocked Wikidata and Commons answers, in the shapes the
 * real APIs return (formatversion=2), trimmed to the fields that are read.
 */

const item = (id: string) => ({ mainsnak: { snaktype: 'value', datavalue: { value: { id } } }, rank: 'normal' });
const str = (value: string) => ({ mainsnak: { snaktype: 'value', datavalue: { value } }, rank: 'normal' });

interface Org {
  label: string;
  aliases?: string[];
  instanceOf?: string;
  logo?: string;
  country?: string;
  owns?: string[];
  sitelinks?: number;
}

const ORGS: Record<string, Org> = {
  Q2001: { label: 'Example Group', instanceOf: 'Q4830453', logo: 'Example Group logo.svg', country: 'Q668', sitelinks: 10 },
  // A holding company without a logo, owning the brand that has one and an unrelated business.
  Q96: { label: 'Jio Platforms', aliases: ['Jio Platforms Limited', 'Jio'], instanceOf: 'Q783794', country: 'Q668', owns: ['Q187', 'Q186'], sitelinks: 14 },
  Q186: { label: 'Jio', aliases: ['Reliance Jio'], instanceOf: 'Q1266169', logo: 'Reliance Jio Logo.svg', country: 'Q668', sitelinks: 29 },
  Q187: { label: 'Jio Financial Tech', instanceOf: 'Q4830453', logo: 'JFT logo.svg', country: 'Q668' },
  Q300: { label: 'NoLogo Corp', instanceOf: 'Q4830453', country: 'Q668' },
  Q400: { label: 'Fairuse Foods', instanceOf: 'Q4830453', logo: 'Fairuse Foods logo.png', country: 'Q668' },
  Q401: { label: 'Twin Co', instanceOf: 'Q4830453', logo: 'Twin A.svg', country: 'Q668' },
  Q402: { label: 'Twin Co', instanceOf: 'Q4830453', logo: 'Twin B.svg', country: 'Q668' },
  // A person never gives a logo, whatever their item says.
  Q500: { label: 'Rahul Brand', instanceOf: 'Q5', logo: 'Rahul signature.svg', country: 'Q668' },
};

const SEARCH: Record<string, string[]> = {
  'Example Group': ['Q2001'],
  'Jio Platforms': ['Q96', 'Q186'],
  'NoLogo Corp': ['Q300'],
  'Fairuse Foods': ['Q400'],
  'Twin Co': ['Q401', 'Q402'],
  'Rahul Brand': ['Q500'],
};

const FILES: Record<string, { licence: string; nonFree?: boolean }> = {
  'File:Example Group logo.svg': { licence: 'Public domain' },
  'File:Reliance Jio Logo.svg': { licence: 'Public domain' },
  'File:JFT logo.svg': { licence: 'CC BY-SA 4.0' },
  'File:Fairuse Foods logo.png': { licence: 'Fair use', nonFree: true },
};

function entity(id: string) {
  const o = ORGS[id];
  if (!o) return { id, missing: '' };
  const claims: Record<string, unknown[]> = { P31: [item(o.instanceOf ?? 'Q4830453')] };
  if (o.logo) claims.P154 = [str(o.logo)];
  if (o.country) claims.P17 = [item(o.country)];
  if (o.owns) claims.P355 = o.owns.map(item);
  return {
    id,
    labels: { en: { value: o.label } },
    aliases: { en: (o.aliases ?? []).map((value) => ({ value })) },
    claims,
    sitelinks: Object.fromEntries(Array.from({ length: o.sitelinks ?? 0 }, (_, i) => [`wiki${i}`, {}])),
  };
}

let calls: Record<string, string>[] = [];

async function wiki(_url: string, params: Record<string, string>): Promise<unknown> {
  calls.push(params);
  if (params.action === 'wbsearchentities') return { search: (SEARCH[params.search!] ?? []).map((id) => ({ id })) };
  if (params.action === 'wbgetentities') return { entities: Object.fromEntries(params.ids!.split('|').map((id) => [id, entity(id)])) };
  const file = FILES[params.titles!];
  if (!file) return { query: { pages: [{ missing: true }] } };
  const slug = params.titles!.replace(/^File:/, '').replace(/\s/g, '_');
  return {
    query: {
      pages: [
        {
          imageinfo: [
            {
              // SVGs come back as a PNG render from the thumbnail host.
              thumburl: `https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/${slug}/1280px-${slug}.png`,
              thumbwidth: 1024,
              thumbheight: 1024,
              descriptionurl: `https://commons.wikimedia.org/wiki/File:${slug}`,
              extmetadata: { LicenseShortName: { value: file.licence }, Artist: { value: '<a href="x">Example Group</a>' }, ...(file.nonFree ? { NonFree: { value: 'true' } } : {}) },
            },
          ],
        },
      ],
    },
  };
}

beforeEach(async () => {
  await resetDb();
  calls = [];
  setWikimediaHttpForTests(wiki);
  setProviders(createFakeProviders());
  const png = await sharp({ create: { width: 1280, height: 1280, channels: 4, background: { r: 15, g: 60, b: 201, alpha: 1 } } }).png().toBuffer();
  setBinaryFetchForTests(async () => png);
});

afterAll(async () => {
  setWikimediaHttpForTests();
  setBinaryFetchForTests();
  await db.$disconnect();
});

describe('resolving a brand', () => {
  test('a company with its own logo (P154)', async () => {
    expect(await resolveBrand('Example Group', { india: true })).toEqual({ wikidataId: 'Q2001', label: 'Example Group', logoFile: 'Example Group logo.svg' });
  });

  test('a holding company without one gives the brand it owns and also goes by, never an unrelated subsidiary', async () => {
    expect(await resolveBrand('Jio Platforms', { india: true })).toEqual({ wikidataId: 'Q186', label: 'Jio', logoFile: 'Reliance Jio Logo.svg' });
  });

  test('no logo, two equally likely companies, or a person: no brand', async () => {
    expect(await resolveBrand('NoLogo Corp', { india: true })).toBeNull();
    expect(await resolveBrand('Twin Co', { india: true })).toBeNull();
    expect(await resolveBrand('Rahul Brand', { india: true })).toBeNull();
    expect(await resolveBrand('Nobody Here', { india: true })).toBeNull();
  });

  test('answers are cached', async () => {
    await resolveBrand('Example Group', { india: true });
    const first = calls.length;
    await resolveBrand('example group', { india: true });
    expect(calls.length).toBe(first);
  });
});

describe('the logo store', () => {
  test('a freely licensed logo is copied to our storage as a PNG and filed with its licence and source', async () => {
    const logo = await brandLogoFor('Jio Platforms', { india: true });
    expect(logo).toMatchObject({ name: 'Jio', aliases: ['Jio Platforms'], wikidataId: 'Q186', licence: 'Public domain', source: 'WIKIMEDIA', status: 'ACTIVE', commonsPage: 'https://commons.wikimedia.org/wiki/File:Reliance_Jio_Logo.svg' });
    expect(logo!.url).toMatch(/^https:\/\/res\.cloudinary\.com\/fake\/.*\/logos\/.*\.png$/);
    expect(logo!.width).toBe(1024);
    // Asked again, by any name it is filed under, it comes from the store without a lookup.
    calls = [];
    expect((await brandLogoFor('Jio Platforms', { india: true }))?.id).toBe(logo!.id);
    expect((await brandLogoFor('jio', { india: true }))?.id).toBe(logo!.id);
    expect(calls).toHaveLength(0);
    expect(await db.brandLogo.count()).toBe(1);
  });

  test('licences: public domain (PD-textlogo included), CC0, CC BY and CC BY-SA only; a non-free logo is refused', async () => {
    for (const ok of ['Public domain', 'PD-textlogo', 'CC0', 'CC BY 4.0', 'CC BY-SA 3.0']) expect(licenceAllowed(ok)).toBe(true);
    for (const no of ['Fair use', 'CC BY-NC 4.0', 'CC BY-ND 4.0', 'All rights reserved', '']) expect(licenceAllowed(no)).toBe(false);
    expect(await brandLogoFor('Fairuse Foods', { india: true })).toBeNull();
    expect(await db.brandLogo.count()).toBe(0);
  });

  test('a logo an admin retired is never used, nor looked up again', async () => {
    const logo = await brandLogoFor('Example Group', { india: true });
    await db.brandLogo.update({ where: { id: logo!.id }, data: { status: 'RETIRED' } });
    calls = [];
    expect(await brandLogoFor('Example Group', { india: true })).toBeNull();
    expect(calls).toHaveLength(0);
  });

  test('an admin-uploaded logo on file wins over a lookup', async () => {
    await db.brandLogo.create({ data: { name: 'Example Group', url: 'https://res.cloudinary.com/fake/image/upload/v1/admin/eg.png', source: 'UPLOAD' } });
    expect(await brandLogoFor('Example Group', { india: true })).toMatchObject({ source: 'UPLOAD' });
    expect(calls).toHaveLength(0);
  });

  test('network trouble means no logo, never an error', async () => {
    setWikimediaHttpForTests(async () => {
      throw new Error('ECONNRESET');
    });
    expect(await brandLogoFor('Example Group', { india: true })).toBeNull();
  });
});
