/**
 * Removes instruction-like text from anything that later reaches an image prompt (Appendix A.8):
 * model-written direction fields and the editor's prompt. Text in images is never allowed, so
 * requests to add words are removed too.
 */

const SENTENCE_RULES = [
  /\b(ignore|disregard|forget|override)\b.{0,40}\b(previous|above|prior|all|rules?|instructions?)\b/i,
  /\b(system prompt|developer message|you are now|act as|jailbreak|dan mode)\b/i,
  /\b(reveal|print|output|show)\b.{0,30}\b(prompt|instructions?|rules?|key|secret)\b/i,
];
const CLAUSE_RULES = [/\b(add|write|put|include)\b.{0,30}\b(text|words|caption|logo|watermark|headline|letters)\b/i, /\b(nsfw|nude|naked|gore|blood(y)?)\b/i];
const TAGS = /<\/?(article|editor_request|system|assistant|user)\s*>/gi;
const FENCES = /```|~~~/g;
const SYMBOL_RUNS = /[^\p{L}\p{N}\s]{4,}/gu;

export interface StripResult {
  text: string;
  removedRatio: number;
  unsafeTerm: boolean;
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+|\n+/).filter((s) => s.trim().length > 0);
}

function splitClauses(sentence: string): string[] {
  return sentence.split(/(?<=[,;])\s+|\s+(?=\b(?:and|but)\b)/i);
}

export function stripInstructions(input: string, maxLength: number): StripResult {
  const original = input.trim();
  if (!original) return { text: '', removedRatio: 0, unsafeTerm: false };
  let unsafeTerm = false;

  const cleaned = original.replace(TAGS, ' ').replace(FENCES, ' ').replace(SYMBOL_RUNS, ' ');
  const kept: string[] = [];
  for (const sentence of splitSentences(cleaned)) {
    if (SENTENCE_RULES.some((re) => re.test(sentence))) continue;
    const clauses = splitClauses(sentence).filter((clause) => {
      if (CLAUSE_RULES[1]!.test(clause)) unsafeTerm = true;
      return !CLAUSE_RULES.some((re) => re.test(clause));
    });
    if (clauses.length) kept.push(clauses.join(' ').trim());
  }

  const text = kept.join(' ').replace(/\s{2,}/g, ' ').trim().slice(0, maxLength);
  const removedRatio = original.length ? Math.max(0, 1 - text.length / Math.min(original.length, maxLength)) : 0;
  return { text, removedRatio, unsafeTerm };
}

/** The editor's prompt is dropped entirely when stripping removed more than half of it. */
export function cleanEditorPrompt(prompt: string | null | undefined): { prompt: string | null; dropped: boolean; unsafeTerm: boolean } {
  if (!prompt?.trim()) return { prompt: null, dropped: false, unsafeTerm: false };
  const result = stripInstructions(prompt, 2_000);
  if (result.removedRatio > 0.5 || !result.text) return { prompt: null, dropped: true, unsafeTerm: result.unsafeTerm };
  return { prompt: result.text, dropped: false, unsafeTerm: result.unsafeTerm };
}
