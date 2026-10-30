import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { placeholderImage } from '../../lib/image';
import { BadModelOutput, ProviderRefusal, ProviderTimeout, ProviderUnavailable, type ChatJsonParams, type ImageData, type ImageGenParams, type Providers } from '../types';

/**
 * Deterministic stand-ins for every provider, so the whole pipeline runs and is tested without
 * spending. Magic words in a prompt or article steer them:
 *
 *   FAKE_REFUSE           every image model refuses
 *   FAKE_REFUSE_PRIMARY   only the first image model asked refuses (the fallback works)
 *   FAKE_IMAGE_FAIL       the image model errors (HTTP 500)
 *   FAKE_GEMINI_DOWN      only Gemini image models error (HTTP 503); OpenAI works
 *   FAKE_OPENAI_DOWN      only OpenAI image models error (HTTP 503); Gemini works
 *   FAKE_TIMEOUT          the call times out
 *   FAKE_JUDGE_FAIL       the final judge finds text in the image
 *   FAKE_BAD_JSON         the read returns JSON in the wrong shape
 *   FAKE_HIGH / FAKE_BLOCKED   the read reports that sensitivity
 *   FAKE_PHOTO            the photo advisor suggests a real photo
 *   FAKE_ADVICE_FAIL      the photo advisor's model errors (HTTP 500)
 *   FAKE_READER_LOW       the reader test scores direction 2 at 5 and rewrites it; the rewrite scores 9
 *   FAKE_READER_WORSE     as FAKE_READER_LOW, but the rewrite scores 4, so the original stays
 *   FAKE_READER_FAIL      the reader test's model errors (HTTP 500)
 *   FAKE_STORY_LOW        the story check scores the "house" idea 4 the first time, 8 after
 *   FAKE_STORY_ALWAYS_LOW the story check scores the "house" idea 3 every time
 *   FAKE_STORY_WORSE      the story check scores the "house" idea 5, then 2
 *   FAKE_STORY_FAIL       the story check's model errors (HTTP 500)
 *   FAKE_TOPIC            the read finds a broad-topic story: no identity, so nothing scores identity
 *   FAKE_READER_GENERIC   the reader test scores direction 3's identity 3 and rewrites it on the
 *                         subject's cues; the rewrite's identity scores 9
 *   FAKE_IDENTITY_LOW     the story check scores the "house" idea's identity 3 the first time, 8 after
 *   FAKE_IDENTITY_MISSING the story check answers without an identity score
 *
 * Without those, the read's main subject is "Example Group", and the story check scores the three
 * fake ideas 7, 9 and 8 for story and the same for identity, so a batch reorders.
 */

const hueOf = (s: string) => parseInt(createHash('sha256').update(s).digest('hex').slice(0, 6), 16) % 360;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface FakeOptions {
  latencyMs?: number;
}

export interface FakeCall {
  kind: string;
  model: string;
  labels?: string[];
  quality?: string;
  imageSize?: string;
  imageCount?: number;
  /** Chat calls with images: the vision detail asked for and the longest side of each image. */
  imageDetail?: string;
  imageSides?: number[];
}

export function createFakeProviders(options: FakeOptions = {}): Providers & { store: Map<string, ImageData>; calls: FakeCall[] } {
  const store = new Map<string, ImageData>();
  const calls: FakeCall[] = [];
  const refusedOnce = new Set<string>();
  const storyChecked = new Set<string>();
  const latency = options.latencyMs ?? 0;

  async function image(p: ImageGenParams, provider: string) {
    calls.push({ kind: `image:${provider}`, model: p.model, labels: p.labels, quality: p.quality, imageSize: p.imageSize, imageCount: p.images.length });
    if (latency) await sleep(latency);
    if (p.prompt.includes(provider === 'gemini' ? 'FAKE_GEMINI_DOWN' : 'FAKE_OPENAI_DOWN')) throw new ProviderUnavailable(503, `${provider} request failed (HTTP 503)`);
    if (p.prompt.includes('FAKE_TIMEOUT')) throw new ProviderTimeout();
    if (p.prompt.includes('FAKE_IMAGE_FAIL')) throw new ProviderUnavailable(500, `${provider} request failed (HTTP 500)`);
    if (p.prompt.includes('FAKE_REFUSE') && !p.prompt.includes('FAKE_REFUSE_PRIMARY')) throw new ProviderRefusal(p.model, 'The image model declined this request.');
    if (p.prompt.includes('FAKE_REFUSE_PRIMARY')) {
      const key = createHash('sha256').update(p.prompt).digest('hex');
      if (!refusedOnce.has(key)) {
        refusedOnce.add(key);
        throw new ProviderRefusal(p.model, 'The image model declined this request.');
      }
    }
    const [w, h] = [1024, 1024];
    const seed = `${p.prompt}|${p.model}|${p.images.length}|${calls.length}`;
    const buffer = await placeholderImage(w, h, hueOf(seed), seed.slice(0, 20));
    return {
      image: { buffer, mimeType: 'image/png' },
      model: p.model,
      usage: provider === 'gemini' ? { input: 1800, imageOutput: 1120, textOutput: 0 } : { textInput: 600, imageInput: 1500, output: 6000 },
    };
  }

  return {
    store,
    calls,

    async chatJson(p: ChatJsonParams) {
      const sideOf = async (buffer: Buffer) => {
        const meta = await sharp(buffer).metadata();
        return Math.max(meta.width ?? 0, meta.height ?? 0);
      };
      const imageSides = p.images?.length ? await Promise.all(p.images.map((i) => sideOf(i.buffer))) : undefined;
      calls.push({ kind: `chat:${p.kind}`, model: p.model, ...(imageSides ? { imageDetail: p.imageDetail ?? 'low', imageSides } : {}) });
      if (latency) await sleep(Math.round(latency / 2));
      if (p.user.includes('FAKE_TIMEOUT')) throw new ProviderTimeout();
      if (p.kind === 'photo_advice' && p.user.includes('FAKE_ADVICE_FAIL')) throw new ProviderUnavailable(500, 'OpenAI request failed (HTTP 500)');
      if (p.kind === 'reader_test' && p.user.includes('FAKE_READER_FAIL')) throw new ProviderUnavailable(500, 'OpenAI request failed (HTTP 500)');
      if (p.kind === 'story_check' && p.user.includes('FAKE_STORY_FAIL')) throw new ProviderUnavailable(500, 'OpenAI request failed (HTTP 500)');
      if (p.kind === 'story_check') {
        const first = !storyChecked.has(p.user);
        storyChecked.add(p.user);
        return { json: fakeStory(p.user, first), usage: { input: 450, cachedInput: 0, output: 40 }, model: p.model };
      }
      return { json: fakeAnswer(p), usage: { input: 2500, cachedInput: 0, output: 600 }, model: p.model };
    },

    async embed(model: string, text: string) {
      calls.push({ kind: 'embed', model });
      return { vector: fakeVector(text), tokens: Math.ceil(text.length / 4) };
    },

    geminiImage: (p) => image(p, 'gemini'),
    openaiImageEdit: (p) => image(p, 'openai'),

    async upload(img, opts) {
      const publicId = `${opts.folder}/${opts.publicId}`;
      const encoded = await sharp(img.buffer).toFormat(opts.format === 'jpg' ? 'jpeg' : opts.format).toBuffer();
      store.set(publicId, { buffer: encoded, mimeType: `image/${opts.format === 'jpg' ? 'jpeg' : opts.format}` });
      const meta = await sharp(encoded).metadata();
      return { url: `https://res.cloudinary.com/fake/image/upload/v1/${publicId}.${opts.format}`, publicId, width: meta.width ?? 0, height: meta.height ?? 0, bytes: encoded.length };
    },

    async destroy(publicId: string) {
      store.delete(publicId);
    },

    async fetchImage(url: string) {
      const m = /\/image\/upload\/(?:[^/]+\/)?v1\/(.+)\.(webp|png|jpg)$/.exec(url);
      const found = m?.[1] ? store.get(m[1]) : undefined;
      if (found) return found;
      // Unknown URL (e.g. a reference seeded directly in a test): a stable placeholder.
      return { buffer: await placeholderImage(640, 360, hueOf(url), 'ref'), mimeType: 'image/png' };
    },
  };
}

/** A 1536-dimension unit vector derived from the text, so similar texts are not identical. */
export function fakeVector(text: string): number[] {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const v = new Array<number>(1536).fill(0);
  for (const word of words) {
    const h = createHash('md5').update(word).digest();
    v[h.readUInt16BE(0) % 1536]! += 1;
    v[h.readUInt16BE(2) % 1536]! += 0.5;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

function availableSlugs(user: string): string[] {
  const at = user.indexOf('AVAILABLE STYLES');
  if (at === -1) return ['grain-metaphor'];
  const slugs = [...user.slice(at).matchAll(/^- ([a-z0-9]+(?:-[a-z0-9]+)*)\b/gm)].map((m) => m[1]!);
  return slugs.length ? slugs : ['grain-metaphor'];
}

const HOUSE = 'A large old house';

function fakeStoryScore(user: string, first: boolean): { storyScore: number; reason: string } {
  if (user.includes(HOUSE)) {
    if (user.includes('FAKE_STORY_ALWAYS_LOW')) return { storyScore: 3, reason: 'A house says nothing about this boardroom story.' };
    if (user.includes('FAKE_STORY_WORSE')) return first ? { storyScore: 5, reason: 'Show the boardroom, not a house.' } : { storyScore: 2, reason: 'Still a house.' };
    if (user.includes('FAKE_STORY_LOW')) return first ? { storyScore: 4, reason: 'Show the two sides of the boardroom fight.' } : { storyScore: 8, reason: 'The boardroom split reads at once.' };
    return { storyScore: 8, reason: 'The dark window reads as the missing piece.' };
  }
  if (user.includes('chess kings')) return { storyScore: 7, reason: 'The standoff reads, the market less so.' };
  return { storyScore: 9, reason: 'The calm ticker against the storm tells it.' };
}

/** Identity is scored only when the check is told the subject; by default it matches the story score. */
function fakeStory(user: string, first: boolean): { storyScore: number; identityScore?: number; reason: string; identityReason?: string } {
  const story = fakeStoryScore(user, first);
  if (!user.includes('THE SUBJECT:') || user.includes('FAKE_IDENTITY_MISSING')) return story;
  if (user.includes(HOUSE) && user.includes('FAKE_IDENTITY_LOW')) {
    return first
      ? { ...story, identityScore: 3, identityReason: 'Any company could own this house; make the teal and the Example Tower prominent.' }
      : { ...story, identityScore: 8, identityReason: 'The teal tower says Example Group.' };
  }
  return { ...story, identityScore: story.storyScore, identityReason: 'The Example Group teal is there.' };
}

/** The fake read's identity: Example Group first, with cues a fake image can be built on. */
export const FAKE_IDENTITY = [
  { name: 'Example Group', kind: 'company', cues: ['Example Group teal #0F7C7C', 'the Example Tower, a stepped white tower in Mumbai', 'Asha Rao'] },
  { name: 'Mumbai', kind: 'place', cues: ['the Bandra-Worli Sea Link'] },
];

/** The reader test: everything passes unless a magic word marks direction 2 (story) or 3 (identity) as weak. */
function fakeReader(user: string): unknown {
  const ranks = [...user.matchAll(/<direction rank="(\d)">/g)].map((m) => Number(m[1]));
  const rewriting = user.includes('REWRITE every direction');
  const weak = user.includes('FAKE_READER_LOW') || user.includes('FAKE_READER_WORSE');
  const subject = user.includes('MAIN SUBJECT:');
  const identity = (score: number) => (subject ? { identityScore: score } : {});
  return {
    directions: ranks.map((rank) => {
      if (!rewriting) return { rank, score: user.includes('FAKE_READER_WORSE') ? 4 : 9, ...identity(9), reason: 'The split boardroom table is this story.' };
      if (subject && user.includes('FAKE_READER_GENERIC') && rank === 3) {
        return {
          rank,
          score: 8,
          identityScore: 3,
          reason: 'Any company could own this old house.',
          rewrite: {
            title: 'The teal tower splits',
            idea: 'The stepped white Example Tower in Mumbai, washed in Example Group teal, splits down the middle as two hands pull it apart.',
            mustShow: ['the stepped white Example Tower in teal', 'two hands pulling it apart'],
            whyItFits: 'The group itself is pulled apart at the top.',
            identityCues: ['Example Group teal #0F7C7C', 'the Example Tower, a stepped white tower in Mumbai'],
          },
        };
      }
      if (weak && rank === 2) {
        return {
          rank,
          score: 5,
          reason: 'A ticker river could be any markets story.',
          rewrite: {
            title: 'A boardroom table pulled apart',
            idea: 'Two hands pull a long boardroom table apart in a quiet Mumbai tower while the share screen behind stays calm.',
            mustShow: ['a boardroom table splitting down the middle', 'two hands pulling it apart', 'a calm share screen behind'],
            whyItFits: 'The fight is in the boardroom; the market behind it barely moves.',
          },
        };
      }
      return { rank, score: 8, ...identity(8), reason: 'A reader of the headline gets it.', rewrite: null };
    }),
  };
}

function fakeAnswer(p: ChatJsonParams): unknown {
  switch (p.kind) {
    case 'read': {
      if (p.user.includes('FAKE_BAD_JSON')) return { headline: 'x' };
      const level = p.user.includes('FAKE_BLOCKED') ? 'BLOCKED' : p.user.includes('FAKE_HIGH') ? 'HIGH' : 'NONE';
      const slugs = availableSlugs(p.user);
      const article = /<article>\n?([\s\S]*?)<\/article>/.exec(p.user)?.[1] ?? '';
      const headline = (article.trim().split('\n')[0] ?? 'Story').slice(0, 100) || 'Story';
      const people = p.user.includes('FAKE_PERSON') ? [{ name: 'Asha Rao', role: 'chair', isPublicFigure: true, isMinor: false }] : [];
      const ideas = [
        'Two chess kings face each other across a polished boardroom table, one small crack running between them.',
        'A calm stock ticker river flows past a quiet glass tower at dawn, untouched by a storm cloud overhead.',
        'A large old house with many lit rooms, one window dark, seen from a garden path at dusk.',
      ];
      return {
        headline,
        thesis: 'The market is choosing to look past a boardroom dispute.',
        tone: 'analytical',
        desk: 'markets',
        entities: { people, orgs: ['Example Group'], places: ['Mumbai'], objects: ['boardroom'], numbers: [] },
        sensitivity: { level, reasons: level === 'NONE' ? [] : ['test sensitivity'] },
        altTextSeed: 'Two chess kings facing each other across a boardroom table.',
        hook: {
          claim: 'Example Group shares hold steady as a boardroom dispute plays out.',
          actors: ['Example Group', 'Mumbai'],
          tension: 'boardroom standoff the market shrugs off',
          stake: 'control of the group',
          readerTakeaway: 'The fight is real, but investors are not worried.',
          indianContext: 'a Mumbai boardroom',
        },
        identity: p.user.includes('FAKE_TOPIC') ? [] : FAKE_IDENTITY,
        directions:
          level === 'BLOCKED'
            ? []
            : ideas.map((idea, i) => ({
                rank: i + 1,
                title: ['Two kings, one board', 'Calm ticker', 'House of many rooms'][i]!,
                idea,
                mustShow: [['two chess kings', 'a crack across the table'], ['a calm ticker river', 'a glass tower', 'a storm cloud'], ['an old house', 'one dark window'] ][i]!,
                whyItFits: 'Shows the dispute and the calm market at once.',
                identityCues: p.user.includes('FAKE_TOPIC') ? [] : [[], ['the Example Tower, a stepped white tower in Mumbai'], ['Example Group teal #0F7C7C']][i]!,
                suggestedStyleSlug: slugs[i % slugs.length]!,
                reason: 'Fits an analytical markets story.',
                peopleDepicted: people.length ? [{ name: 'Asha Rao', how: 'illustrated' }] : [],
                avoid: ['no faces in close-up'],
              })),
      };
    }
    case 'judge':
      return {
        hasText: p.user.includes('FAKE_JUDGE_FAIL'),
        hasLogoOrWatermark: false,
        anatomyOk: true,
        matchesPreview: true,
        onStyle: 4,
        appeal: 4,
        ideaClarity: 4,
        composition: 4,
        photorealNewsRisk: false,
        realPersonLikenessRisk: false,
        notes: p.user.includes('FAKE_JUDGE_FAIL') ? 'There is lettering on the table.' : '',
      };
    case 'alt_text':
      return { altText: 'Illustration of two chess kings facing each other across a boardroom table.', caption: 'A boardroom standoff the market is ignoring.' };
    case 'describe_reference':
      return {
        description: 'An editorial illustration of a coin balanced on a scale against a calm background, with a single strong focal point and generous negative space.',
        subjects: ['money', 'symbol'],
        mood: 'calm',
      };
    case 'preview_text':
      return { hasText: false, where: '' };
    case 'reader_test':
      return fakeReader(p.user);
    case 'likeness_check':
      return { likeness: 'good', notes: '' };
    case 'photo_advice':
      if (p.user.includes('FAKE_BAD_JSON')) return { suggestPhoto: 'maybe' };
      return p.user.includes('FAKE_PHOTO')
        ? { suggestPhoto: true, kind: 'real-person', reason: 'A named chief executive is at the centre of this results story.' }
        : { suggestPhoto: false, kind: 'none', reason: 'An analysis piece that an illustration can carry.' };
    case 'screen_artwork':
      return {
        onStyle: p.user.includes('FAKE_OFF_STYLE') ? 3 : 8,
        hasReadableText: false,
        hasLogoOrWatermark: false,
        hasSignature: false,
        isPhotoOfRealPerson: false,
        depictsRecognizablePerson: false,
        hasLicensedCharacterOrBrand: false,
        explicitOrGory: false,
        isAiGeneratedLooking: false,
        reason: 'Matches the medium and palette.',
      };
    case 'screen_exemplar':
      return { hasText: false, hasWatermarkOrSignature: false, anatomyOk: true, onStyle: 4, reason: '' };
    default:
      throw new BadModelOutput('unknown kind');
  }
}
