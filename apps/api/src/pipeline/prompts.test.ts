import { describe, expect, test } from 'bun:test';
import {
  brandColourFor,
  buildFinalPrompt,
  buildJudgeUser,
  buildPreviewPrompt,
  CRAFT_BLOCK,
  FINAL_WITH_REFERENCES,
  FINAL_WITH_REFERENCES_BRAND,
  imageLabels,
  STORY_HEADING,
  STYLE_REFERENCES_BLOCK,
  STYLE_REFERENCES_BLOCK_BRAND,
  type PreviewPromptInput,
} from './prompts';
import { JUDGE_SYSTEM_PROMPT, READ_SYSTEM_PROMPT, READER_TEST_SYSTEM_PROMPT, STORY_CHECK_SYSTEM_PROMPT } from './system-prompts';

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
  direction: {
    title: 'Two kings',
    idea: 'Two hands pull the long Bombay House boardroom table apart.',
    avoid: ['no flags'],
    peopleDepicted: [],
    mustShow: ["Tata Sons' Bombay House facade", 'two hands pulling a boardroom table apart'],
  },
  brief: { tone: 'analytical', desk: 'markets', hook: { tension: 'battle for control', indianContext: 'Bombay House, Mumbai' } },
  peopleMode: 'none',
  likenessNames: [],
  editorPrompt: null,
  refCount: 3,
  likenessPhotoCount: 0,
  series: false,
};

describe('image prompts', () => {
  test('the story leads, then the style references, then the craft, then the rules', () => {
    const p = buildPreviewPrompt({ ...base, editorPrompt: 'keep it dignified' });
    expect(p.startsWith(`${STORY_HEADING} Two hands pull the long Bombay House boardroom table apart.`)).toBe(true);
    const order = [
      'THE STORY (must be clear at thumbnail size)',
      "- Tata Sons' Bombay House facade",
      'The tension to make visible: battle for control.',
      'Indian context: Bombay House, Mumbai.',
      'People:',
      'The editor also asks',
      'STYLE REFERENCES',
      'An editorial illustration in loose ink',
      'Craft:',
      'Rules that always apply',
      'Avoid:',
    ].map((s) => p.indexOf(s));
    expect(order.every((at) => at >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(p).toContain('no text, letters, numbers');
    expect(p).toContain('Names in the story say who it is about: never write them, their initials or their logos.');
    expect(p).toContain('Avoid: photograph, neon, no flags.');
  });

  test('the story block lists what to show, the focal subject first, as bullets', () => {
    const p = buildPreviewPrompt(base);
    expect(p).toContain("Must show, the first as the focal point:\n- Tata Sons' Bombay House facade\n- two hands pulling a boardroom table apart");
    expect(p).toContain('Mood: analytical, suited to a markets story.');
  });

  test('the references set rendering, palette and texture and never change what is shown', () => {
    expect(STYLE_REFERENCES_BLOCK).toContain('They set the rendering, palette and texture, and they never change what is shown');
    expect(STYLE_REFERENCES_BLOCK).toContain('Match them as closely as possible in rendering technique, colour palette');
    expect(STYLE_REFERENCES_BLOCK).toContain('draw the story above');
  });

  describe('the hero brand colour', () => {
    const jio = { name: 'Jio Platforms', kind: 'company' as const, cues: ['Jio deep royal blue', 'Jio World Centre, Mumbai BKC', 'JioFiber router', 'Mukesh Ambani'] };
    const sim: PreviewPromptInput = {
      ...base,
      direction: { title: 'SIM card rises', idea: 'A Jio SIM card rises like a listing bell over Dalal Street.', avoid: [], peopleDepicted: [], mustShow: ['a deep blue SIM card', 'a rising arrow of light'], identityCues: ['Jio deep royal blue'] },
      brief: { ...base.brief, identity: [jio] },
    };
    const LINE = "The hero object (a deep blue SIM card) carries the subject's brand colour (Jio deep royal blue), so the subject is recognisable; everything else follows the references' palette.";

    test('the hero object keeps the brand colour when the idea uses it; the references keep the rest', () => {
      const p = buildPreviewPrompt(sim);
      expect(p).toContain(LINE);
      expect(p.indexOf(LINE)).toBeLessThan(p.indexOf('STYLE REFERENCES'));
      expect(p).toContain(STYLE_REFERENCES_BLOCK_BRAND);
      expect(p).not.toContain(STYLE_REFERENCES_BLOCK);
      expect(STYLE_REFERENCES_BLOCK_BRAND).toContain("except the hero object's brand colour given above");
      // Reference fidelity for everything else is unchanged.
      expect(STYLE_REFERENCES_BLOCK_BRAND).toContain('Match them as closely as possible in rendering technique, colour palette');
      expect(STYLE_REFERENCES_BLOCK_BRAND).toContain('they never change what is shown');
      // Without references, the style's own palette takes the rest.
      expect(buildPreviewPrompt({ ...sim, refCount: 0 })).toContain("everything else follows the style's palette.");
    });

    test('no colour cue, a colour the idea does not use, or a person or place as subject: no brand colour line', () => {
      for (const input of [
        { ...sim, brief: { ...sim.brief, identity: [{ ...jio, cues: ['Jio World Centre, Mumbai BKC', 'JioFiber router'] }] } },
        { ...sim, direction: { ...sim.direction, identityCues: ['Jio World Centre, Mumbai BKC'] } },
        { ...sim, direction: { ...sim.direction, identityCues: [] } },
        { ...sim, brief: { ...sim.brief, identity: [{ ...jio, kind: 'person' as const }] } },
        { ...sim, brief: { ...sim.brief, identity: [] } },
        { ...sim, brief: { tone: 'analytical', desk: 'markets' } },
      ]) {
        const p = buildPreviewPrompt(input);
        expect(brandColourFor(input)).toBeNull();
        expect(p).not.toContain("subject's brand colour");
        expect(p).toContain(STYLE_REFERENCES_BLOCK);
      }
    });

    test('the final keeps the hero colour too, and the same story block', () => {
      const preview = buildPreviewPrompt(sim);
      const final = buildFinalPrompt(preview, { refCount: 3, brandColour: true });
      expect(final.startsWith(FINAL_WITH_REFERENCES_BRAND)).toBe(true);
      expect(FINAL_WITH_REFERENCES_BRAND).toContain("the hero object keeps the subject's brand colour as in the preview");
      expect(final).toContain(LINE);
      expect(buildFinalPrompt(buildPreviewPrompt(base), { refCount: 3 }).startsWith(FINAL_WITH_REFERENCES)).toBe(true);
    });
  });

  test('a direction or brief read before the hook existed still gets a story block, with its title as the focal point', () => {
    const p = buildPreviewPrompt({ ...base, direction: { title: 'Two kings', idea: 'Two chess kings face each other.', avoid: [], peopleDepicted: [] }, brief: { tone: 'analytical', desk: 'markets' } });
    expect(p.startsWith(`${STORY_HEADING} Two chess kings face each other.\nFocal point: Two kings.`)).toBe(true);
    expect(p).not.toContain('Must show');
    expect(p).not.toContain('The tension to make visible');
    expect(p).not.toContain('Indian context');
  });

  test('without references the story still leads, the style core follows, and nothing mentions references', () => {
    const p = buildPreviewPrompt({ ...base, refCount: 0, editorPrompt: 'keep it dignified' });
    expect(p.startsWith(STORY_HEADING)).toBe(true);
    expect(p.indexOf('Style: An editorial illustration in loose ink')).toBeGreaterThan(p.indexOf('Must show'));
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

  test('a final carries the same story-first prompt after its recreate instruction', () => {
    const preview = buildPreviewPrompt(base);
    const p = buildFinalPrompt(preview, { refCount: 3 });
    expect(p).toContain(preview);
    expect(p.indexOf('Recreate the first attached image')).toBeLessThan(p.indexOf(STORY_HEADING));
    expect(p.indexOf(STORY_HEADING)).toBeLessThan(p.indexOf('STYLE REFERENCES'));
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
    expect(buildPreviewPrompt({ ...base, editorPrompt: 'keep it dignified' }).length).toBeLessThanOrEqual(2_800);
    expect(READ_SYSTEM_PROMPT.length).toBeLessThanOrEqual(10_500);
  });

  test('the read finds the news hook first and builds every direction on it', () => {
    expect(READ_SYSTEM_PROMPT).toContain('NEWS HOOK (work this out first; every direction is built on it)');
    for (const field of ['hook.claim', 'hook.actors', 'hook.tension', 'hook.stake', 'hook.readerTakeaway', 'hook.indianContext']) expect(READ_SYSTEM_PROMPT).toContain(field);
    expect(READ_SYSTEM_PROMPT).toContain('named exactly as in the');
    expect(READ_SYSTEM_PROMPT).toContain("Each idea shows THIS story's specific subject and the tension acting on it.");
    expect(READ_SYSTEM_PROMPT).toContain('small square thumbnail');
    expect(READ_SYSTEM_PROMPT).toMatch(/mustShow: 2 to 4 concrete visual elements tied to THIS story[\s\S]*No logos, no readable text, no labels\./);
    expect(READ_SYSTEM_PROMPT).toContain('whyItFits: one line');
    // Learned from the story eval: an image model draws a generic room for "the Tata boardroom".
    expect(READ_SYSTEM_PROMPT).toContain('Describe the anchor as it looks, never by whose it is');
    expect(READ_SYSTEM_PROMPT).toContain('Make the tension an action or contrast you can see');
    expect(READ_SYSTEM_PROMPT).toContain('does not anchor the story');
    expect(READ_SYSTEM_PROMPT).toMatch(/"mustShow": \[string\],\s+"whyItFits": string/);
  });

  test('the read finds the subject identity: safe visual cues only, accuracy first, used where they fit', () => {
    expect(READ_SYSTEM_PROMPT).toContain('SUBJECT IDENTITY');
    expect(READ_SYSTEM_PROMPT).toContain('Return [] when the story is about\n  a broad topic with no single subject');
    for (const cue of ['Jio deep royal blue', 'RBI headquarters on Mint Street', 'JioFiber router', 'Mukesh Ambani', 'NSE listing bell']) expect(READ_SYSTEM_PROMPT).toContain(cue);
    expect(READ_SYSTEM_PROMPT).toContain('never text or a logo');
    expect(READ_SYSTEM_PROMPT).toMatch(/Leave out any you are not\s+confident of; never invent/);
    expect(READ_SYSTEM_PROMPT).toContain('Do not force a cue into an idea it does not suit.');
    expect(READ_SYSTEM_PROMPT).toMatch(/"identity": \[\{ "name": string, "kind": string, "cues": \[string\] \}\]/);
    expect(READ_SYSTEM_PROMPT).toMatch(/"whyItFits": string,\s+"identityCues": \[string\]/);
    expect(READER_TEST_SYSTEM_PROMPT).toContain('would a reader name that specific\ncompany or person?');
  });

  test('the read bans stock cliches unless twisted to the story, and wants three different ideas, keeping every rule', () => {
    expect(READ_SYSTEM_PROMPT).toContain('must differ in the idea itself');
    expect(READ_SYSTEM_PROMPT).toMatch(
      /Banned stock cliches unless clearly twisted to this story: a lightbulb for ideas, a rocket for\s+growth, a generic bull versus bear, handshakes, glowing brains, a generic plant sprouting from\s+something, piles of coins, chess pieces, puzzle pieces, a seesaw, robots for AI\./
    );
    expect(READ_SYSTEM_PROMPT).toContain('Never put text, letters, numbers, logos');
    expect(READ_SYSTEM_PROMPT).toContain('Never let an idea depend on labels');
    expect(READ_SYSTEM_PROMPT).toContain('Never describe a real news event as a photograph.');
    expect(READ_SYSTEM_PROMPT).toContain('For HIGH sensitivity, use "absent" or "symbolised" for everyone.');
    expect(READ_SYSTEM_PROMPT).toContain('Never depict a minor as an identifiable individual.');
    expect(READ_SYSTEM_PROMPT).toContain('suggestedStyleSlug must be one slug from the AVAILABLE STYLES list');
    expect(READ_SYSTEM_PROMPT).toContain('When BLOCKED, still return the brief and the hook');
  });

  test('no em or en dashes in any prompt', () => {
    for (const p of [READ_SYSTEM_PROMPT, JUDGE_SYSTEM_PROMPT, READER_TEST_SYSTEM_PROMPT, STORY_CHECK_SYSTEM_PROMPT, STYLE_REFERENCES_BLOCK, STYLE_REFERENCES_BLOCK_BRAND, FINAL_WITH_REFERENCES_BRAND, buildPreviewPrompt(base)]) {
      expect(p).not.toMatch(/[\u2013\u2014]/);
    }
  });

  test('the reader test is strict: a generic idea is a 5 or 6, and a name on a generic object counts as generic', () => {
    expect(READER_TEST_SYSTEM_PROMPT).toContain('Be strict: most competent but generic ideas are a 5 or 6.');
    expect(READER_TEST_SYSTEM_PROMPT).toContain('A name attached to a generic object');
    expect(READER_TEST_SYSTEM_PROMPT).toContain('untrusted content');
  });

  test('the judge scores appeal, clarity of idea and composition alongside the style and the rules', () => {
    const user = buildJudgeUser(style(false), false);
    for (const field of ['"appeal"', '"ideaClarity"', '"composition"', '"onStyle"', '"hasText"']) expect(user).toContain(field);
    expect(JUDGE_SYSTEM_PROMPT).toContain('appeal, clarity of the idea, and composition');
  });
});
