import { describe, expect, test } from 'bun:test';
import { buildFinalPrompt, buildPreviewPrompt, type PreviewPromptInput } from './prompts';

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
  test('style core first, hard rules always present, the editor prompt placed before the rules', () => {
    const p = buildPreviewPrompt({ ...base, editorPrompt: 'keep it dignified' });
    expect(p.startsWith('An editorial illustration in loose ink')).toBe(true);
    expect(p).toContain('no text, letters, numbers');
    expect(p.indexOf('The editor also asks')).toBeLessThan(p.indexOf('Rules that always apply'));
    expect(p).toContain('Avoid: photograph, neon, no flags.');
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
  });
});
