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
 *   FAKE_TIMEOUT          the call times out
 *   FAKE_JUDGE_FAIL       the final judge finds text in the image
 *   FAKE_BAD_JSON         the read returns JSON in the wrong shape
 *   FAKE_HIGH / FAKE_BLOCKED   the read reports that sensitivity
 */

const hueOf = (s: string) => parseInt(createHash('sha256').update(s).digest('hex').slice(0, 6), 16) % 360;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface FakeOptions {
  latencyMs?: number;
}

export function createFakeProviders(options: FakeOptions = {}): Providers & { store: Map<string, ImageData>; calls: { kind: string; model: string }[] } {
  const store = new Map<string, ImageData>();
  const calls: { kind: string; model: string }[] = [];
  const refusedOnce = new Set<string>();
  const latency = options.latencyMs ?? 0;

  async function image(p: ImageGenParams, provider: string) {
    calls.push({ kind: `image:${provider}`, model: p.model });
    if (latency) await sleep(latency);
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
      calls.push({ kind: `chat:${p.kind}`, model: p.model });
      if (latency) await sleep(Math.round(latency / 2));
      if (p.user.includes('FAKE_TIMEOUT')) throw new ProviderTimeout();
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
  if (at === -1) return ['editorial-flat'];
  const slugs = [...user.slice(at).matchAll(/^- ([a-z0-9]+(?:-[a-z0-9]+)*)\b/gm)].map((m) => m[1]!);
  return slugs.length ? slugs : ['editorial-flat'];
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
        directions:
          level === 'BLOCKED'
            ? []
            : ideas.map((idea, i) => ({
                rank: i + 1,
                title: ['Two kings, one board', 'Calm ticker', 'House of many rooms'][i]!,
                idea,
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
