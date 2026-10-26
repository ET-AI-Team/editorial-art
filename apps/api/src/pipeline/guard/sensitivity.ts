import { higherSensitivity, type SensitivityLevel } from '@editorial-art/shared-types';

/**
 * The code floor under the model's sensitivity reading (Appendix A.7). The model can miss a
 * death in paragraph nine; these rules cannot. The final level is the higher of the two.
 */

interface Rule {
  id: string;
  re: RegExp;
  /** Only counts when this other rule also matched. */
  with?: string[];
}

const HIGH: Rule[] = [
  { id: 'H01', re: /\b(dead|death|deaths|died|dies|dying)\b/g },
  { id: 'H02', re: /\b(kill(ed|s|ing)?|murder(ed|s)?|homicide|lynch(ed|ing)?)\b/g },
  { id: 'H03', re: /\b(suicide|self[- ]harm)\b/g },
  { id: 'H04', re: /\b(rape(d|s)?|sexual assault|molest(ed|ation)?)\b/g },
  { id: 'H05', re: /\b(blast|explosion|bomb(ing|ed)?|ied)\b/g },
  { id: 'H06', re: /\b(terror(ist|ism)?|militant(s)?|insurgent(s)?)\b/g },
  { id: 'H07', re: /\b(riot(s|ing)?|communal (violence|clash(es)?|tension)|mob violence)\b/g },
  { id: 'H08', re: /\b(stampede|crush(ed)? to death)\b/g },
  { id: 'H09', re: /\b(earthquake|tsunami|cyclone|landslide|cloudburst)\b/g, with: ['H01'] },
  { id: 'H10', re: /\b(flood(s|ing)?)\b/g, with: ['H01'] },
  { id: 'H11', re: /\b(crash(ed|es)?|derail(ed|ment)|collision)\b/g, with: ['H01', 'H11X'] },
  { id: 'H11X', re: /\b(injured|casualt(y|ies))\b/g, with: ['H11'] },
  { id: 'H12', re: /\b(shot dead|gunfire|firing|shooting)\b/g },
  { id: 'H13', re: /\b(war|airstrike|shelling|missile strike)\b/g, with: ['H01'] },
  { id: 'H14', re: /\b(epidemic|outbreak|pandemic)\b/g, with: ['H01'] },
  { id: 'H15', re: /\b(maut|mrityu|hatya|aatmhatya|dhamaka|aatank(wadi|vad)?|dange|bhagdad|balatkar)\b/g },
];

const ELEVATED: Rule[] = [
  { id: 'E01', re: /\b(fraud(ulent)?|scam(s)?|ponzi|embezzle(ment|d)?|money laundering)\b/g },
  { id: 'E02', re: /\b(arrest(ed|s)?|detain(ed)?|custody|bail)\b/g },
  { id: 'E03', re: /\b(layoff(s)?|laid off|retrench(ment|ed)|job cuts|fired)\b/g },
  { id: 'E04', re: /\b(lawsuit|sued|petition|court|tribunal|nclt|sebi order|penalty|fine(d)?)\b/g },
  { id: 'E05', re: /\b(raid(s|ed)?|search(es)? and seizure|ed probe|cbi|enforcement directorate)\b/g },
  { id: 'E06', re: /\b(election(s)?|poll(s)?|campaign rally|exit poll|ballot)\b/g },
  { id: 'E07', re: /\b(default(ed|s)?|insolven(t|cy)|bankrupt(cy)?|liquidation)\b/g },
  { id: 'E08', re: /\b(protest(s|ers)?|strike|bandh|agitation)\b/g },
  { id: 'E09', re: /\b(allegation(s)?|accused|charge ?sheet|indict(ed|ment)?)\b/g },
  { id: 'E10', re: /\b(ghotala|giraftar|chhapa|chunav|dhokhadhadi)\b/g },
];

const BLOCKED_ANYWHERE: Rule[] = [
  { id: 'B01', re: /\b(beheading|dismember(ed|ment)|mutilat(ed|ion)|gore|graphic (images|video|footage))\b/g },
  { id: 'B02', re: /\b(child (sexual )?abuse|csam|child pornography|minor (was )?(raped|assaulted))\b/g },
  { id: 'B04', re: /\b(join (the )?(jihad|isis|terror)|glorif(y|ies|ied) (terror|attack))\b/g },
];
const B03 = /\b(porn(ographic)?|explicit sexual|nude images)\b/;
const DEPICT = /\b(show|depict|image|picture|illustrat)/;

/** Lowercase with diacritics folded, so "Mṛtyu" and "mrityu" match the same rule. */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase();
}

function count(re: RegExp, text: string): number {
  return (text.match(re) ?? []).length;
}

function matchedRules(rules: Rule[], body: string, title: string): { ids: string[]; inBody: number; inTitle: number } {
  const raw = new Map<string, { body: number; title: number }>();
  for (const rule of rules) raw.set(rule.id, { body: count(rule.re, body), title: count(rule.re, title) });
  const ids: string[] = [];
  let inBody = 0;
  let inTitle = 0;
  for (const rule of rules) {
    const hit = raw.get(rule.id)!;
    if (hit.body + hit.title === 0) continue;
    if (rule.with && !rule.with.some((other) => (raw.get(other)?.body ?? 0) + (raw.get(other)?.title ?? 0) > 0)) continue;
    if (rule.id.endsWith('X')) continue; // companion pattern only
    ids.push(rule.id);
    inBody += hit.body;
    inTitle += hit.title;
  }
  return { ids, inBody, inTitle };
}

export interface SensitivityFloor {
  level: SensitivityLevel;
  ruleIds: string[];
}

export function sensitivityFloor(input: { text: string; title?: string | null; editorPrompt?: string | null }): SensitivityFloor {
  const body = fold(input.text);
  const title = fold(input.title ?? '');
  const prompt = fold(input.editorPrompt ?? '');

  const blocked = matchedRules(BLOCKED_ANYWHERE, `${body}\n${prompt}`, title);
  if (blocked.ids.length) return { level: 'BLOCKED', ruleIds: blocked.ids };
  // Reporting such content is HIGH; asking for an image of it is BLOCKED.
  if (B03.test(prompt) && DEPICT.test(prompt)) return { level: 'BLOCKED', ruleIds: ['B03'] };

  const high = matchedRules(HIGH, body, title);
  if (high.inBody + high.inTitle >= 2 || high.inTitle >= 1) return { level: 'HIGH', ruleIds: high.ids };

  const elevated = matchedRules(ELEVATED, body, title);
  if (elevated.inBody + elevated.inTitle >= 2 || high.ids.length) return { level: 'ELEVATED', ruleIds: [...high.ids, ...elevated.ids] };

  return { level: 'NONE', ruleIds: [] };
}

export function finalSensitivity(modelLevel: SensitivityLevel, floor: SensitivityFloor): SensitivityLevel {
  return higherSensitivity(modelLevel, floor.level);
}

/** Styles that read as satire, never used once a story carries any sensitivity. */
export const SATIRE_PRONE_SLUGS = new Set(['clay-puppet', 'retro-indian']);
