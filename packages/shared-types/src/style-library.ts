import { StyleLibrarySeed } from './schemas/style';

/**
 * The machine-readable seed lives at the end of docs/STYLE_LIBRARY.md, under the heading
 * "Machine-readable seed", so the readable rule sheets and the seeded rows come from one file.
 */
export function parseStyleLibrary(markdown: string): StyleLibrarySeed {
  const at = markdown.indexOf('## Machine-readable seed');
  if (at === -1) throw new Error('STYLE_LIBRARY.md has no "Machine-readable seed" section');
  const block = /```json\n([\s\S]*?)\n```/.exec(markdown.slice(at));
  if (!block?.[1]) throw new Error('STYLE_LIBRARY.md seed section has no json block');
  return StyleLibrarySeed.parse(JSON.parse(block[1]));
}
