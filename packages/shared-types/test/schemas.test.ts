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
  PhotoAdviceBody,
  PhotoAdviceOutput,
  PhotoAdviceResponse,
  AdminOptionInputs,
  ReaderTestOutput,
  ReadOutput,
  StoryCheck,
  higherSensitivity,
  judgePasses,
  parseStyleLibrary,
  StyleLibrarySeed,
} from '../src';

const LIBRARY = readFileSync(join(import.meta.dir, '../../../docs/STYLE_LIBRARY.md'), 'utf8');

describe('style library seed', () => {
  const seed = parseStyleLibrary(LIBRARY);

  test('has 33 styles in the 9 families, every family with at least one, in family order', () => {
    expect(seed.styles).toHaveLength(33);
    expect(seed.families.map((f) => f.slug)).toEqual([...FAMILY_SLUGS]);
    expect(FAMILY_SLUGS).toHaveLength(9);
    const familyOrder = seed.styles.map((s) => FAMILY_SLUGS.indexOf(s.familySlug));
    expect(familyOrder).toEqual([...familyOrder].sort((a, b) => a - b));
    for (const family of FAMILY_SLUGS) expect(seed.styles.some((s) => s.familySlug === family)).toBe(true);
    expect(seed.styles.map((s) => s.sortOrder)).toEqual(seed.styles.map((_, i) => i + 1));
  });

  test('families may hold different numbers of styles, but never none, and slugs are unique', () => {
    const counts = FAMILY_SLUGS.map((f) => seed.styles.filter((s) => s.familySlug === f).length);
    expect(new Set(counts).size).toBeGreaterThan(1);
    const withoutDrawing = { ...seed, styles: seed.styles.filter((s) => s.familySlug !== 'drawing') };
    expect(StyleLibrarySeed.safeParse(withoutDrawing).success).toBe(false);
    const duplicate = { ...seed, styles: [...seed.styles, { ...seed.styles[0]!, sortOrder: 99 }] };
    expect(StyleLibrarySeed.safeParse(duplicate).success).toBe(false);
    const oneStyleEach = { ...seed, styles: FAMILY_SLUGS.map((f) => seed.styles.find((s) => s.familySlug === f)!) };
    expect(StyleLibrarySeed.safeParse(oneStyleEach).success).toBe(true);
    const oldFamily = { ...seed, styles: [...seed.styles, { ...seed.styles[0]!, slug: 'old-style', familySlug: 'flat-vector' }] };
    expect(StyleLibrarySeed.safeParse(oldFamily).success).toBe(false);
  });

  test('photoreal styles show objects only and never allow real people; every other style with people does, except mixed-media', () => {
    const photoreal = seed.styles.filter((s) => s.safety.photoreal).map((s) => s.slug);
    expect(photoreal.sort()).toEqual(['cinematic-3d', 'photo-montage', 'still-life']);
    for (const style of seed.styles.filter((s) => s.safety.photoreal)) {
      expect(style.safety.allowsPeople).toBe(false);
      expect(style.safety.allowsRealPeople).toBe(false);
    }
    // Mixed-media builds figures from photo fragments, so a real face there would read as a photograph.
    const withoutFaces = seed.styles.filter((s) => s.safety.allowsPeople && !s.safety.allowsRealPeople).map((s) => s.slug);
    expect(withoutFaces).toEqual(['mixed-media']);
  });

  test('the at-a-glance table shows the same real-people flag as the seed', () => {
    for (const style of seed.styles) {
      const row = LIBRARY.split('\n').find((line) => line.includes(`| \`${style.slug}\` |`));
      expect(row?.split('|').map((c) => c.trim())[6]).toBe(style.safety.allowsRealPeople ? 'yes' : 'no');
    }
  });

  test('every style has the three base donts and says no text, letters, numbers or logos', () => {
    for (const style of seed.styles) {
      expect(style.ruleSheet.dont.slice(0, 3)).toEqual([
        'no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing',
        'no brand marks, watermarks or signatures',
        "no imitation of any named artist's signature style",
      ]);
      expect(style.ruleSheet.promptCore).toContain('No text, letters, numbers or logos.');
      expect(style.ruleSheet.negative.startsWith('text, letters, numbers, logos')).toBe(true);
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

  test('promptCore and palette never prescribe colours: the references set them', () => {
    const named = /\b(teal|tomato|mustard|cream|navy|ultramarine|cobalt|vermilion|ochre|coral|lilac|lemon|mint|sage|magenta|turmeric|saffron|lapis|malachite|indigo|cerulean|sienna|amber|cyan|graphite|terracotta|marigold|plum|blush|red|blue|green|yellow|orange|pink|violet|purple|gold)\b/i;
    for (const style of seed.styles) {
      for (const field of [style.ruleSheet.promptCore, style.ruleSheet.palette]) {
        expect(field).not.toMatch(/#[0-9a-f]{3,6}\b/i);
        expect(field).not.toMatch(named);
        expect(field).not.toMatch(/such as [a-z ]+ on [a-z]+/i);
      }
      expect(style.ruleSheet.palette).toContain('taken from the references');
    }
  });

  test('the file has no em or en dashes', () => {
    expect(LIBRARY).not.toMatch(/[\u2013\u2014]/);
  });

  test('no rule sheet asks for an imitation of a person or names an artist', () => {
    const artists = [...LIBRARY.matchAll(/^- \*\*Reference artists \(curation only\):\*\* (.+)$/gm)].flatMap((m) => m[1]!.split(', '));
    expect(artists.length).toBeGreaterThan(20);
    for (const style of seed.styles) {
      expect(style.ruleSheet.promptCore.toLowerCase()).not.toContain('in the style of');
      const sheet = JSON.stringify(style.ruleSheet);
      for (const name of artists) expect(sheet).not.toContain(name);
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

describe('photo advice', () => {
  test('the body needs text; the title is optional; nothing else is allowed', () => {
    expect(PhotoAdviceBody.safeParse({ text: 'A story.' }).success).toBe(true);
    expect(PhotoAdviceBody.safeParse({ title: 'T', text: 'A story.' }).success).toBe(true);
    expect(PhotoAdviceBody.safeParse({ title: 'T' }).success).toBe(false);
    expect(PhotoAdviceBody.safeParse({ text: 'A'.repeat(40_001) }).success).toBe(false);
    expect(PhotoAdviceBody.safeParse({ text: 'A story.', extra: 1 }).success).toBe(false);
  });

  test('the response kind is a closed set and the reason is at most 160 characters', () => {
    expect(PhotoAdviceResponse.safeParse({ suggestPhoto: true, reason: 'A match report.', kind: 'sports' }).success).toBe(true);
    expect(PhotoAdviceResponse.safeParse({ suggestPhoto: true, reason: 'x', kind: 'weather' }).success).toBe(false);
    expect(PhotoAdviceResponse.safeParse({ suggestPhoto: false, reason: 'x'.repeat(161), kind: 'none' }).success).toBe(false);
    expect(PhotoAdviceOutput.safeParse({ suggestPhoto: 'yes', kind: 'none' }).success).toBe(false);
  });
});

describe('model outputs', () => {
  const direction = (rank: number) => ({
    rank,
    title: `Direction ${rank}`,
    idea: 'Two chess kings face each other across a boardroom table at dusk.',
    mustShow: ["Tata Sons' Bombay House facade", 'two hands pulling a boardroom table apart'],
    whyItFits: 'The fight for the board is the story.',
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
    hook: {
      claim: 'Tata Sons rejects Noel Tata objections to the board vote.',
      actors: ['Tata Sons', 'Noel Tata', 'Bombay House'],
      tension: 'battle for control',
      stake: 'who appoints the chairman',
      readerTakeaway: 'The Tata board fight is escalating.',
      indianContext: 'Bombay House in Mumbai',
    },
    directions: [direction(1), direction(2), direction(3)],
  };

  test('the read carries a news hook, and every direction what it must show and why it fits', () => {
    const parsed = ReadOutput.parse(read);
    expect(parsed.hook.tension).toBe('battle for control');
    expect(parsed.directions[0]!.mustShow).toHaveLength(2);
    const { hook: _hook, ...noHook } = read;
    expect(ReadOutput.safeParse(noHook).success).toBe(false);
    expect(ReadOutput.safeParse({ ...read, hook: { ...read.hook, tension: '' } }).success).toBe(false);
    expect(ReadOutput.safeParse({ ...read, hook: { ...read.hook, extra: 'x' } }).success).toBe(false);
    // An empty Indian context is fine: not every story has one.
    expect(ReadOutput.safeParse({ ...read, hook: { ...read.hook, indianContext: '' } }).success).toBe(true);
  });

  test('mustShow takes 2 to 4 concrete elements (up to 6 are tolerated and trimmed in code); whyItFits is required', () => {
    const withMust = (mustShow: string[]) => ({ ...read, directions: [{ ...direction(1), mustShow }, direction(2), direction(3)] });
    expect(ReadOutput.safeParse(withMust(['one thing'])).success).toBe(false);
    expect(ReadOutput.safeParse(withMust(['a', 'b'].map((x) => `${x} thing`))).success).toBe(true);
    expect(ReadOutput.safeParse(withMust(['a', 'b', 'c', 'd', 'e', 'f'].map((x) => `${x} thing`))).success).toBe(true);
    expect(ReadOutput.safeParse(withMust(['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((x) => `${x} thing`))).success).toBe(false);
    const { whyItFits: _w, ...noWhy } = direction(1);
    expect(ReadOutput.safeParse({ ...read, directions: [noWhy, direction(2), direction(3)] }).success).toBe(false);
  });

  test('the story check scores 1 to 10 with a reason; admins see it with the reader score', () => {
    expect(StoryCheck.safeParse({ storyScore: 7, reason: 'The split table reads.' }).success).toBe(true);
    expect(StoryCheck.safeParse({ storyScore: 0, reason: 'x' }).success).toBe(false);
    expect(StoryCheck.safeParse({ storyScore: 7.5, reason: 'x' }).success).toBe(false);
    const story = { score: null, reason: null, redraws: 0, readerScore: null, readerReason: null };
    expect(AdminOptionInputs.safeParse({ optionId: '11111111-1111-4111-8111-111111111111', preview: null, final: null, story }).success).toBe(true);
    expect(AdminOptionInputs.safeParse({ optionId: '11111111-1111-4111-8111-111111111111', preview: null, final: null }).success).toBe(false);
  });

  test('the reader test scores 1 to 10 and a rewrite is optional', () => {
    const answer = ReaderTestOutput.parse({ directions: [{ rank: 1, score: 8, reason: 'Gets it.' }] });
    expect(answer.directions[0]!.rewrite).toBeNull();
    expect(ReaderTestOutput.safeParse({ directions: [{ rank: 1, score: 11, reason: 'x' }] }).success).toBe(false);
    expect(
      ReaderTestOutput.safeParse({
        directions: [{ rank: 2, score: 5, reason: 'Generic.', rewrite: { title: 'Split table', idea: 'Two hands pull the Tata boardroom table apart.', mustShow: ['a boardroom table', 'two hands'], whyItFits: 'The fight.' } }],
      }).success
    ).toBe(true);
  });

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
    // Craft: a missing score is middling; a plainly unattractive or cluttered final is retried.
    expect(pass.appeal).toBe(3);
    expect(judgePasses({ ...pass, appeal: 1 })).toBe(false);
    expect(judgePasses({ ...pass, composition: 1 })).toBe(false);
    expect(judgePasses({ ...pass, ideaClarity: 1 })).toBe(true);
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
