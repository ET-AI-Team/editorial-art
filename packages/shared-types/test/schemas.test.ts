import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AltTextOutput,
  ArtworkScreen,
  artworkPasses,
  CreateBatchBody,
  CreateRequestBody,
  FAMILY_SLUGS,
  JudgeOutput,
  ReadOutput,
  higherSensitivity,
  judgePasses,
  parseStyleLibrary,
} from '../src';

const LIBRARY = readFileSync(join(import.meta.dir, '../../../docs/STYLE_LIBRARY.md'), 'utf8');

describe('style library seed', () => {
  const seed = parseStyleLibrary(LIBRARY);

  test('has 48 styles, 4 in each of the 12 families, in family order', () => {
    expect(seed.styles).toHaveLength(48);
    expect(seed.families.map((f) => f.slug)).toEqual([...FAMILY_SLUGS]);
    const familyOrder = seed.styles.map((s) => FAMILY_SLUGS.indexOf(s.familySlug));
    expect(familyOrder).toEqual([...familyOrder].sort((a, b) => a - b));
    expect(seed.styles.map((s) => s.sortOrder)).toEqual(seed.styles.map((_, i) => i + 1));
  });

  test('photoreal styles never allow real people, and the photo family is all photoreal', () => {
    for (const style of seed.styles.filter((s) => s.safety.photoreal)) expect(style.safety.allowsRealPeople).toBe(false);
    for (const style of seed.styles.filter((s) => s.familySlug === 'photo-realism')) expect(style.safety.photoreal).toBe(true);
  });

  test('every style has the three base donts', () => {
    for (const style of seed.styles) {
      expect(style.ruleSheet.dont.slice(0, 3)).toEqual([
        'no text, letters, numbers or symbols that read as writing anywhere in the image',
        'no logos, brand marks, watermarks or signatures',
        "no imitation of any named artist's signature style",
      ]);
    }
  });

  test('the readable sections match the seed', () => {
    const families = new Map(seed.families.map((f) => [f.slug, f.label]));
    const sections = LIBRARY.slice(0, LIBRARY.indexOf('## Machine-readable seed')).split(/\n## \d+\. /).slice(1);
    expect(sections).toHaveLength(seed.styles.length);
    seed.styles.forEach((style, i) => {
      const section = sections[i]!;
      expect(section.startsWith(`${style.label}\n`)).toBe(true);
      expect(section).toContain(`- **Slug:** \`${style.slug}\``);
      expect(section).toContain(`- **Family:** ${families.get(style.familySlug)}`);
      expect(section).toContain(`- **Summary:** ${style.summary}`);
      expect(section).toContain(`> ${style.ruleSheet.promptCore}`);
      expect(section).toContain(`**Negative:** ${style.ruleSheet.negative}`);
      const s = style.safety;
      expect(section).toContain(`**Safety:** allowsPeople: **${s.allowsPeople}**, allowsRealPeople: **${s.allowsRealPeople}**, allowsSensitive: **${s.allowsSensitive}**, photoreal: **${s.photoreal}**`);
      for (const line of [...style.ruleSheet.do, ...style.ruleSheet.dont]) expect(section).toContain(`- ${line}\n`);
    });
  });

  test('the file has no em or en dashes', () => {
    expect(LIBRARY).not.toMatch(/[\u2013\u2014]/);
  });

  test('no rule sheet asks for an imitation of a person', () => {
    for (const style of seed.styles) {
      expect(style.ruleSheet.promptCore.toLowerCase()).not.toContain('in the style of');
    }
  });
});

describe('request bodies', () => {
  const article = 'A'.repeat(400);

  test('accepts a plain article', () => {
    expect(CreateRequestBody.safeParse({ articleText: article }).success).toBe(true);
  });

  test('refuses short, long, control characters and unknown fields', () => {
    expect(CreateRequestBody.safeParse({ articleText: 'short' }).success).toBe(false);
    expect(CreateRequestBody.safeParse({ articleText: 'A'.repeat(40_001) }).success).toBe(false);
    expect(CreateRequestBody.safeParse({ articleText: `${article}\u0007` }).success).toBe(false);
    expect(CreateRequestBody.safeParse({ articleText: article, surprise: 1 }).success).toBe(false);
  });

  test('keeps newlines and tabs', () => {
    expect(CreateRequestBody.safeParse({ articleText: `${article}\n\n\tmore` }).success).toBe(true);
  });

  test('batch kinds are a closed set', () => {
    expect(CreateBatchBody.safeParse({ kind: 'MORE' }).success).toBe(true);
    expect(CreateBatchBody.safeParse({ kind: 'ANOTHER_STYLE' }).success).toBe(false);
    expect(CreateBatchBody.safeParse({ kind: 'EDIT' }).success).toBe(false);
  });
});

describe('model outputs', () => {
  const direction = (rank: number) => ({
    rank,
    title: `Direction ${rank}`,
    idea: 'Two chess kings face each other across a boardroom table at dusk.',
    suggestedStyleSlug: 'ink-wash',
    reason: 'Analytical tone.',
    peopleDepicted: [],
    avoid: [],
  });
  const read = {
    headline: 'Board dispute',
    thesis: 'The market shrugs off a boardroom fight.',
    tone: 'analytical',
    desk: 'markets',
    entities: { people: [], orgs: [], places: [], objects: [], numbers: [] },
    sensitivity: { level: 'NONE', reasons: [] },
    altTextSeed: 'Two chess kings across a table.',
    directions: [direction(1), direction(2), direction(3)],
  };

  test('needs exactly three ranked directions unless blocked', () => {
    expect(ReadOutput.safeParse(read).success).toBe(true);
    expect(ReadOutput.safeParse({ ...read, directions: [direction(1)] }).success).toBe(false);
    expect(ReadOutput.safeParse({ ...read, directions: [direction(1), direction(1), direction(3)] }).success).toBe(false);
    expect(ReadOutput.safeParse({ ...read, sensitivity: { level: 'BLOCKED', reasons: ['x'] }, directions: [] }).success).toBe(true);
  });

  test('the judge passes only when every check holds', () => {
    const pass = JudgeOutput.parse({
      hasText: false,
      hasLogoOrWatermark: false,
      anatomyOk: true,
      matchesPreview: true,
      onStyle: 3,
      photorealNewsRisk: false,
      realPersonLikenessRisk: false,
      notes: '',
    });
    expect(judgePasses(pass)).toBe(true);
    expect(judgePasses({ ...pass, onStyle: 2 })).toBe(false);
    expect(judgePasses({ ...pass, hasText: true })).toBe(false);
    expect(judgePasses({ ...pass, photorealNewsRisk: true })).toBe(false);
  });

  test('an artwork passes the library screen only on style and with no flag set', () => {
    const pass = ArtworkScreen.parse({
      onStyle: 7,
      hasReadableText: false,
      hasLogoOrWatermark: false,
      hasSignature: false,
      isPhotoOfRealPerson: false,
      depictsRecognizablePerson: false,
      hasLicensedCharacterOrBrand: false,
      explicitOrGory: false,
      isAiGeneratedLooking: false,
      reason: 'Clear linocut gouge marks.',
    });
    expect(artworkPasses(pass)).toBe(true);
    expect(artworkPasses({ ...pass, onStyle: 6.5 })).toBe(false);
    expect(artworkPasses({ ...pass, hasSignature: true })).toBe(false);
    expect(artworkPasses({ ...pass, isAiGeneratedLooking: true })).toBe(false);
    expect(artworkPasses({ ...pass, depictsRecognizablePerson: true })).toBe(false);
    expect(artworkPasses({ ...pass, hasLicensedCharacterOrBrand: true })).toBe(false);
    expect(ArtworkScreen.safeParse({ ...pass, onStyle: 11 }).success).toBe(false);
  });

  test('alt text never calls the image a photo', () => {
    expect(AltTextOutput.safeParse({ altText: 'Illustration of two chess kings', caption: 'A boardroom standoff.' }).success).toBe(true);
    expect(AltTextOutput.safeParse({ altText: 'Illustration, photo of two men', caption: '' }).success).toBe(false);
    expect(AltTextOutput.safeParse({ altText: 'Two chess kings', caption: '' }).success).toBe(false);
  });

  test('the higher sensitivity always wins', () => {
    expect(higherSensitivity('NONE', 'HIGH')).toBe('HIGH');
    expect(higherSensitivity('BLOCKED', 'ELEVATED')).toBe('BLOCKED');
  });
});
