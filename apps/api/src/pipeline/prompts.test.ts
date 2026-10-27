import { describe, expect, test } from 'bun:test';
import { buildFinalPrompt, buildJudgeUser, buildPreviewPrompt, CRAFT_BLOCK, FINAL_WITH_REFERENCES, imageLabels, STYLE_REFERENCES_BLOCK, type PreviewPromptInput } from './prompts';
import { JUDGE_SYSTEM_PROMPT, READ_SYSTEM_PROMPT } from './system-prompts';

const style = (photoreal: boolean, allowsPeople = true, slug = photoreal ? 'still-life' : 'ink-wash') =>
  ({
    id: 's',
    slug,
    label: 'Ink and wash',
    summary: '',
    familySlug: photoreal ? 'objects-sets' : 'drawing',
    goodFor: [],
    ruleSheet: { promptCore: 'An editorial illustration in loose ink line with grey wash.', negative: 'photograph, neon' },
    safety: { allowsPeople, allowsRealPeople: allowsPeople && !photoreal, allowsSensitive: true, photoreal },
  }) as unknown as PreviewPromptInput['style'];

const base: PreviewPromptInput = {
  style: style(false),
  direction: { title: 'Two kings', idea: 'Two chess kings face each other.', avoid: ['no flags'], peopleDepicted: [] },
  brief: { tone: 'analytical', desk: 'markets' },
  peopleMode: 'none',
  likenessNames: [],
  editorPrompt: null,
  refCount: 3,
  likenessPhotoCount: 0,
  series: false,
};

describe('image prompts', () => {
  test('with references, the style instruction leads, then the scene, the craft and the rules', () => {
    const p = buildPreviewPrompt({ ...base, editorPrompt: 'keep it dignified' });
    expect(p.startsWith('STYLE REFERENCES: The attached reference images, all by working illustrators, define the visual style.')).toBe(true);
    expect(p).toContain('They override any colour or style detail described in words below. Do not copy their subjects or compositions: draw the new scene described below.');
    const order = ['STYLE REFERENCES', 'Scene: Two chess kings', 'An editorial illustration in loose ink', 'Craft:', 'The editor also asks', 'Rules that always apply', 'Avoid:'].map((s) => p.indexOf(s));
    expect(order.every((at) => at >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(p).toContain('no text, letters, numbers');
    expect(p).toContain('Avoid: photograph, neon, no flags.');
  });

  test('without references the style core opens the prompt, as before, and nothing mentions references', () => {
    const p = buildPreviewPrompt({ ...base, refCount: 0, editorPrompt: 'keep it dignified' });
    expect(p.startsWith('An editorial illustration in loose ink')).toBe(true);
    expect(p).not.toContain(STYLE_REFERENCES_BLOCK);
    expect(p).not.toMatch(/references/i);
    expect(p.indexOf('The editor also asks')).toBeLessThan(p.indexOf('Rules that always apply'));
  });

  test('photoreal styles never get a people clause that shows people, whatever their family', () => {
    const p = buildPreviewPrompt({ ...base, style: style(true, true), peopleMode: 'illustrated', likenessNames: ['Asha Rao'] });
    expect(p).toContain('no people at all');
    expect(p).toContain('objects and places only');
    expect(p).not.toContain('recognisable');
  });

  test('interface pieces are banned outright, except in an interface style, which still gets no readable writing', () => {
    expect(buildPreviewPrompt(base)).toContain('user-interface elements');
    const p = buildPreviewPrompt({ ...base, style: style(false, true, 'interface-hybrid') });
    expect(p).not.toContain('user-interface elements');
    expect(p).toContain('no text, letters, numbers');
    expect(p).toContain('readable labels or writing on any interface element');
  });

  test('illustrated people only with likeness photos; otherwise symbolised', () => {
    expect(buildPreviewPrompt({ ...base, peopleMode: 'illustrated', likenessNames: ['Asha Rao'], likenessPhotoCount: 2 })).toContain('show Asha Rao as illustrated figures');
    expect(buildPreviewPrompt({ ...base, peopleMode: 'symbolised', direction: { ...base.direction, peopleDepicted: [{ name: 'Asha Rao', how: 'symbolised', likenessId: null }] } })).toContain("do not show anyone's face");
  });

  test('the final prompt keeps the preview and adds a fix note when retrying', () => {
    const p = buildFinalPrompt('PREVIEW', { fixNote: 'remove lettering on the table' });
    expect(p).toContain('Recreate the first attached image');
    expect(p).toContain('PREVIEW');
    expect(p).toContain('Fix only this, change nothing else: remove lettering on the table.');
    expect(p).not.toContain(FINAL_WITH_REFERENCES);
  });

  test('with references, the final says the preview comes first and the references after it', () => {
    const p = buildFinalPrompt('PREVIEW', { refCount: 3 });
    expect(p.startsWith('The first attached image is the approved preview; keep its composition exactly. The next images are the style references; match their rendering, palette and texture exactly.')).toBe(true);
  });

  test('every attached image is labelled in order, so a reference is never mistaken for a photo', () => {
    expect(imageLabels(['preview', 'reference', 'reference', 'reference', 'likeness', 'series'], ['Asha Rao'])).toEqual([
      'Approved preview (keep its composition exactly):',
      'Style reference 1 of 3:',
      'Style reference 2 of 3:',
      'Style reference 3 of 3:',
      'Reference photo 1 of 1 of Asha Rao, for likeness only, not style:',
      'Earlier illustration in this series (match its palette and visual language):',
    ]);
  });

  test('the craft block keeps the quality bar, puts style fidelity first, and sets no layout zone or colour', () => {
    expect(CRAFT_BLOCK).toContain('Style fidelity to the references comes first.');
    for (const want of [/one dominant focal point/i, /silhouette/, /thumbnail/, /square 1:1/, /safe margins/, /Polished, finished/, /No clutter/]) expect(CRAFT_BLOCK).toMatch(want);
    expect(CRAFT_BLOCK).not.toMatch(/top quarter|headline|palette/i);
    for (const input of [base, { ...base, style: style(true, false) }, { ...base, series: true, editorPrompt: 'calm' }]) {
      const p = buildPreviewPrompt(input);
      expect(p).toContain(CRAFT_BLOCK);
      expect(p).not.toMatch(/in the style of/i);
      expect(buildFinalPrompt(p)).toContain(CRAFT_BLOCK);
    }
  });

  test('prompts stay tight', () => {
    expect(CRAFT_BLOCK.length).toBeLessThanOrEqual(600);
    expect(buildPreviewPrompt({ ...base, editorPrompt: 'keep it dignified' }).length).toBeLessThanOrEqual(2_400);
    expect(READ_SYSTEM_PROMPT.length).toBeLessThanOrEqual(6_000);
  });

  test('the read asks for one clever idea per direction, three different ideas, and no stock cliches, keeping every rule', () => {
    expect(READ_SYSTEM_PROMPT).toContain('ONE clear, clever visual idea a reader gets in about two seconds');
    expect(READ_SYSTEM_PROMPT).toContain('must differ in the idea itself');
    expect(READ_SYSTEM_PROMPT).toMatch(/bull versus bear.*lightbulb.*robots for AI.*handshakes.*glowing brains.*piles of coins/s);
    expect(READ_SYSTEM_PROMPT).toContain('Never put text, letters, numbers, logos');
    expect(READ_SYSTEM_PROMPT).toContain('Never describe a real news event as a photograph.');
    expect(READ_SYSTEM_PROMPT).toContain('For HIGH sensitivity, use "absent" or "symbolised" for everyone.');
  });

  test('the judge scores appeal, clarity of idea and composition alongside the style and the rules', () => {
    const user = buildJudgeUser(style(false), false);
    for (const field of ['"appeal"', '"ideaClarity"', '"composition"', '"onStyle"', '"hasText"']) expect(user).toContain(field);
    expect(JUDGE_SYSTEM_PROMPT).toContain('appeal, clarity of the idea, and composition');
  });
});
