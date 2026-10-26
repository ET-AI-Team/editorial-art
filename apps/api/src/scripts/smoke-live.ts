/**
 * One real request end to end against a running service, with real providers.
 *
 *   bun run smoke:live
 *   bun run smoke:live -- --article samples/story.txt --style ink-wash
 *
 * Creates a request, waits for the first batch, finalizes option 0 and waits for its pack, then
 * prints how long each phase took and what it cost. Exits non-zero if anything failed or any phase
 * took more than twice its target (first preview 40 s, all previews 75 s, final plus pack 90 s).
 * Refuses to start when the build budget could not cover one more run (about Rs 60).
 */
import { readFileSync } from 'node:fs';
import type { RequestDetail, SpendSummary, StylesResponse } from '@editorial-art/shared-types';
import { env } from '../lib/env';

const RUN_COST_INR = 60;
const TARGETS_S = { firstPreview: 40, allPreviews: 75, finalAndPack: 90 } as const;

const SAMPLE_ARTICLE = `Sensex climbs 600 points as banks lead a broad rally

Indian equities rose sharply on Thursday, with the Sensex climbing about 600 points and the Nifty
closing above a key level, as banking stocks rallied on hopes of stable interest rates and strong
quarterly earnings. Analysts said foreign investors returned as buyers after several weeks of
selling, while mid-cap and small-cap indices also gained. Market breadth was positive, with
advancing stocks outnumbering decliners on both exchanges. Traders said the rally was supported by
easing crude oil prices and a steadier rupee, though they cautioned that global cues could keep
volatility high in the coming sessions.`;

interface Args {
  article: string;
  style: string | null;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { article: SAMPLE_ARTICLE, style: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--article') args.article = readFileSync(argv[++i] ?? '', 'utf8');
    else if (a === '--style') args.style = argv[++i] ?? null;
    else throw new Error(`Unknown argument: ${a}`);
  }
  return args;
}

const base = (process.env.EA_SMOKE_BASE ?? 'http://127.0.0.1:7202').replace(/\/$/, '');
const key = env().EA_INTERNAL_API_KEYS.split(',')[0]!.trim();
const headers = {
  'content-type': 'application/json',
  'x-api-key': key,
  'x-actor-user-id': '00000000-0000-4000-8000-00000000f001',
  'x-actor-workspace-id': '00000000-0000-4000-8000-00000000f002',
  'x-actor-role': 'admin',
};

async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${base}/api/v1${path}`, { method: init.method ?? 'GET', headers, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { code: string; message: string } };
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} -> ${res.status} ${json.error?.code ?? ''} ${json.error?.message ?? ''}`.trim());
  return json;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const seconds = (from: number) => Math.round((Date.now() - from) / 100) / 10;

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const spend = await api<SpendSummary>('/admin/spend');
  if (spend.buildCapInr !== null && (spend.buildInr ?? 0) + RUN_COST_INR > spend.buildCapInr) {
    throw new Error(`The build budget cannot cover another run (Rs ${spend.buildInr} of Rs ${spend.buildCapInr} used).`);
  }

  let styleId: string | null = null;
  if (args.style) {
    const styles = await api<StylesResponse>('/styles');
    styleId = styles.families.flatMap((f) => f.styles).find((s) => s.slug === args.style && s.available)?.id ?? null;
    if (!styleId) throw new Error(`Style "${args.style}" is not LIVE.`);
  }

  const start = Date.now();
  const created = await api<{ requestId: string }>('/requests', {
    method: 'POST',
    body: { articleText: args.article, styleId, clientRef: `smoke-${Date.now()}` },
  });
  console.log(`Request ${created.requestId}`);

  const t: { directions?: number; firstPreview?: number; allPreviews?: number; finalAndPack?: number } = {};
  let detail!: RequestDetail;
  while (true) {
    detail = await api<RequestDetail>(`/requests/${created.requestId}`);
    if (detail.status === 'FAILED') throw new Error(`Request failed: ${detail.failure?.code} ${detail.failure?.reason}`);
    if (t.directions === undefined && detail.directions.length) t.directions = seconds(start);
    const batch = detail.batches.find((b) => b.seq === 1);
    if (t.firstPreview === undefined && batch?.options.some((o) => o.previewUrl)) t.firstPreview = seconds(start);
    if (batch && ['READY', 'PARTIAL', 'FAILED'].includes(batch.status)) {
      t.allPreviews = seconds(start);
      if (batch.status === 'FAILED') throw new Error('Every preview in the first batch failed.');
      break;
    }
    if (Date.now() - start > TARGETS_S.allPreviews * 2 * 1000 + 30_000) throw new Error('Timed out waiting for the first batch.');
    await sleep(1000);
  }

  const option = detail.batches[0]!.options.find((o) => o.state === 'PREVIEW_READY');
  if (!option) throw new Error('No preview was ready to finalize.');
  const finalStart = Date.now();
  await api(`/options/${option.id}/finalize`, { method: 'POST' });
  while (true) {
    const o = await api<{ state: string; failureReason: string | null }>(`/options/${option.id}`);
    if (o.state === 'PACK_READY') break;
    if (o.state === 'FINAL_FAILED' || o.state === 'PACK_FAILED') throw new Error(`Finalize failed: ${o.state} ${o.failureReason ?? ''}`);
    if (Date.now() - finalStart > TARGETS_S.finalAndPack * 2 * 1000 + 30_000) throw new Error('Timed out waiting for the final and pack.');
    await sleep(1000);
  }
  t.finalAndPack = seconds(finalStart);

  const final = await api<RequestDetail>(`/requests/${created.requestId}`);
  console.log(`Directions:     ${t.directions ?? '?'} s`);
  console.log(`First preview:  ${t.firstPreview ?? '?'} s (target ${TARGETS_S.firstPreview} s)`);
  console.log(`All previews:   ${t.allPreviews} s (target ${TARGETS_S.allPreviews} s)`);
  console.log(`Final and pack: ${t.finalAndPack} s (target ${TARGETS_S.finalAndPack} s)`);
  console.log(`Cost:           Rs ${final.costInr}`);

  const slow = (
    [
      ['first preview', t.firstPreview ?? Infinity, TARGETS_S.firstPreview],
      ['all previews', t.allPreviews ?? Infinity, TARGETS_S.allPreviews],
      ['final and pack', t.finalAndPack, TARGETS_S.finalAndPack],
    ] as const
  ).filter(([, took, target]) => took > target * 2);
  if (slow.length) throw new Error(`Too slow: ${slow.map(([name]) => name).join(', ')}.`);
  console.log('Smoke run passed.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
