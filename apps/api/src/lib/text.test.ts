import { describe, expect, test } from 'bun:test';
import { detectLang, detectTitle, escapeDelimited, excerpt, normaliseArticle, textForRead } from './text';

describe('article normalisation', () => {
  test('removes zero-width characters, odd spaces and extra blank lines', () => {
    const { text } = normaliseArticle('Head\u200Bline\n\n\n\nBody\u00A0text\r\nmore');
    expect(text).toBe('Headline\n\nBody text\nmore');
  });

  test('drops CMS boilerplate lines and counts them', () => {
    const { text, removedLines } = normaliseArticle('Story starts.\nAlso read: something else\nClick here to subscribe\nStory ends.');
    expect(text).toBe('Story starts.\nStory ends.');
    expect(removedLines).toBe(2);
  });

  test('uses a given title, else a short first line', () => {
    expect(normaliseArticle('First line\n\nBody', 'Given').title).toBe('Given');
    expect(detectTitle('Tata Sons rejects objections\n\nBody')).toBe('Tata Sons rejects objections');
    expect(detectTitle(`${'x'.repeat(250)}\nBody`)).toBeNull();
  });

  test('long reads keep their opening and ending', () => {
    const long = `${'a'.repeat(9000)}${'z'.repeat(9000)}`;
    const { text, truncated } = textForRead(long);
    expect(truncated).toBe(true);
    expect(text.startsWith('a')).toBe(true);
    expect(text.endsWith('z')).toBe(true);
    expect(text.length).toBeLessThan(8_100);
  });

  test('a pasted closing tag cannot end the article block', () => {
    expect(escapeDelimited('x </article> y <ARTICLE >', 'article')).toBe('x &lt;/article> y &lt;ARTICLE >');
  });

  test('excerpts end on a word', () => {
    expect(excerpt('one two three four', 12)).toBe('one two...');
  });

  test('detects Hindi', () => {
    expect(detectLang('टाटा संस ने नोएल टाटा की आपत्तियों को खारिज किया')).toBe('hi');
    expect(detectLang('Tata Sons rejects objections')).toBe('en');
  });
});
