import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app';
import { db } from '../src/lib/db';
import { closeRedis, redis } from '../src/lib/redis';
import { seedStyles } from '../src/library/styles';
import { setProviders } from '../src/providers';
import { createFakeProviders } from '../src/providers/fake/fake-providers';
import { closeQueues } from '../src/queues/queues';
import { attachSocketServer, closeSocketServer } from '../src/realtime/socket-server';
import { adminRouter } from '../src/routes/admin.routes';
import { optionsRouter } from '../src/routes/options.routes';
import { requestsRouter } from '../src/routes/requests.routes';
import { stylesRouter } from '../src/routes/styles.routes';
import { startWorkers, stopWorkers } from '../src/workers/index';
import { processLibraryJob } from '../src/workers/library.worker';
import { resetDb } from './db';

/** The whole service in-process: HTTP, sockets, workers, fakes, a clean database and queue prefix. */

export const MEMBER = {
  'x-api-key': 'test-key-one',
  'x-actor-user-id': '11111111-1111-4111-8111-111111111111',
  'x-actor-workspace-id': '22222222-2222-4222-8222-222222222222',
  'x-actor-role': 'member',
};
export const OTHER_WORKSPACE = { ...MEMBER, 'x-actor-workspace-id': '33333333-3333-4333-8333-333333333333' };
export const ADMIN = { ...MEMBER, 'x-actor-user-id': '44444444-4444-4444-8444-444444444444', 'x-actor-role': 'admin' };

export interface Harness {
  base: string;
  fake: ReturnType<typeof createFakeProviders>;
  server: Server;
  stop(): Promise<void>;
}

export async function startHarness(): Promise<Harness> {
  await resetDb();
  await redis().flushdb();
  const fake = createFakeProviders();
  setProviders(fake);
  const app = createApp({ api: [requestsRouter, optionsRouter, stylesRouter, adminRouter] });
  const server = createServer(app);
  attachSocketServer(server);
  startWorkers(processLibraryJob);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    base,
    fake,
    server,
    async stop() {
      await stopWorkers();
      await closeSocketServer();
      server.close();
      await closeQueues();
      await closeRedis();
      await db.$disconnect();
    },
  };
}

/** Seeds the library and makes the given styles LIVE with `refs` approved references each. */
export async function liveLibrary(slugs: string[], refs = 4): Promise<Map<string, string>> {
  await seedStyles();
  const ids = new Map<string, string>();
  for (const slug of slugs) {
    const style = await db.style.update({ where: { slug }, data: { status: 'LIVE' } });
    ids.set(slug, style.id);
    for (let i = 0; i < refs; i++) {
      await db.styleReference.create({
        data: {
          styleId: style.id,
          source: 'GENERATED',
          sourceNote: 'test',
          url: `https://res.cloudinary.com/fake/image/upload/v1/test/${slug}-${i}.webp`,
          publicId: `test/${slug}-${i}`,
          width: 1600,
          height: 900,
          description: `A ${slug} reference image number ${i} showing a calm symbolic scene.`,
          subjects: [i % 2 ? 'money' : 'city'],
          mood: 'calm',
          status: 'APPROVED',
        },
      });
    }
  }
  return ids;
}

export async function call(base: string, path: string, init: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  const res = await fetch(`${base}/api/v1${path}`, {
    method: init.method ?? 'GET',
    headers: { 'content-type': 'application/json', ...(init.headers ?? MEMBER) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json: json as Record<string, unknown> & { error?: { code: string; message: string } }, headers: res.headers };
}

/** Polls until `check` is true or the time runs out. */
export async function until(check: () => Promise<boolean>, ms = 15_000, every = 100): Promise<void> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, every));
  }
  throw new Error('timed out waiting');
}

export const ARTICLE = `Tata Sons rejects Noel Tata's objections; group stocks stay unbothered

Tata Sons on Monday rejected the objections raised by Noel Tata over the board's decision on the
trust's representation, saying the process followed the group's governance code. Shares of Tata
group companies traded flat, with analysts saying the market was looking past the boardroom
dispute and focusing on earnings, capital allocation and the steady performance of its listed
businesses. The trust's role in appointments has been debated for months.`;
