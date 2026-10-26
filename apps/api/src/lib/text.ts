/**
 * Turns pasted article text into a clean, predictable form before anything else sees it:
 * NFC, no zero-width or odd spaces, no CMS boilerplate lines, at most one blank line in a row.
 */

const ZERO_WIDTH = /[\u200B-\u200D\u2060\uFEFF]/g;
const ODD_SPACES = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g;

/** Lines that are page furniture rather than the story. Matched against a trimmed line. */
const BOILERPLATE = [
  /^also read\b/i,
  /^read more\b/i,
  /^read also\b/i,
  /^click here\b/i,
  /^subscribe\b/i,
  /^follow us on\b/i,
  /^download the .* app\b/i,
  /^(catch|get) all the (latest|business)\b/i,
  /^\(this story has not been edited/i,
  /^advertisement$/i,
  /^share (this|on)\b/i,
];

export interface NormalisedArticle {
  text: string;
  /** Detected headline, when the first line looks like one. */
  title: string | null;
  removedLines: number;
}

export function normaliseArticle(raw: string, givenTitle?: string | null): NormalisedArticle {
  const text = raw.normalize('NFC').replace(ZERO_WIDTH, '').replace(ODD_SPACES, ' ').replace(/\r\n?/g, '\n');

  let removedLines = 0;
  const kept: string[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.replace(/[ \t]+$/g, '');
    if (BOILERPLATE.some((re) => re.test(trimmed.trim()))) {
      removedLines++;
      continue;
    }
    kept.push(trimmed);
  }

  const joined = kept
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { text: joined, title: givenTitle?.trim() || detectTitle(joined), removedLines };
}

/** The first line, when it is short and stands apart from the body. */
export function detectTitle(text: string): string | null {
  const [first, second] = text.split('\n');
  if (!first) return null;
  const candidate = first.trim();
  if (candidate.length === 0 || candidate.length > 200) return null;
  if (/[.!?]$/.test(candidate) && candidate.length > 120) return null;
  if (second !== undefined && second.trim() !== '' && candidate.length > 120) return null;
  return candidate;
}

/**
 * What the read call sees. Long reads keep their opening and their ending, where the point of a
 * long piece usually sits.
 */
export function textForRead(text: string, maxChars = 12_000): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false };
  const head = text.slice(0, 6_000);
  const tail = text.slice(-2_000);
  return { text: `${head}\n\n[...]\n\n${tail}`, truncated: true };
}

export function excerpt(text: string, max = 400): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 3).replace(/\s+\S*$/, '')}...`;
}

/** Rough language guess: Devanagari-heavy text is Hindi, everything else English. */
export function detectLang(text: string): string {
  const sample = text.slice(0, 2_000);
  const devanagari = (sample.match(/[\u0900-\u097F]/g) ?? []).length;
  const letters = (sample.match(/\p{L}/gu) ?? []).length || 1;
  return devanagari / letters > 0.3 ? 'hi' : 'en';
}

/** Escapes a closing delimiter so pasted text cannot end its own block early. */
export function escapeDelimited(text: string, tag: string): string {
  return text.replace(new RegExp(`</?${tag}\\s*>`, 'gi'), (m) => m.replace('<', '&lt;'));
}
