import { afterAll, describe, expect, test } from 'bun:test';
import { Router } from 'express';
import type { AddressInfo } from 'node:net';
import { createApp } from './app';
import { closeRedis } from './lib/redis';

const echo = Router();
echo.get('/echo', (req, res) => res.json({ actor: req.actor, callerKeyId: req.callerKeyId }));

const server = createApp({ api: [echo] }).listen(0);
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

afterAll(async () => {
  server.close();
  await closeRedis();
});

const actor = {
  'x-actor-user-id': '11111111-1111-4111-8111-111111111111',
  'x-actor-workspace-id': '22222222-2222-4222-8222-222222222222',
  'x-actor-role': 'member',
};

describe('app', () => {
  test('health needs no key', async () => {
    const res = await fetch(`${base}/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  test('ready checks Postgres and Redis', async () => {
    const res = await fetch(`${base}/ready`);
    expect(res.status).toBe(200);
  });

  test('every /api/v1 call needs the key', async () => {
    expect((await fetch(`${base}/api/v1/echo`, { headers: actor })).status).toBe(401);
    expect((await fetch(`${base}/api/v1/echo`, { headers: { ...actor, 'x-api-key': 'wrong' } })).status).toBe(401);
  });

  test('the actor headers are required and checked', async () => {
    const res = await fetch(`${base}/api/v1/echo`, { headers: { 'x-api-key': 'test-key-one', 'x-actor-user-id': 'not-a-uuid' } });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  test('a valid key and actor reach the route, with the key fingerprint and not the key', async () => {
    const res = await fetch(`${base}/api/v1/echo`, { headers: { ...actor, 'x-api-key': 'test-key-one' } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.actor.role).toBe('member');
    expect(body.callerKeyId).toMatch(/^[0-9a-f]{6}$/);
  });

  test('unknown routes use the error envelope and carry a request id', async () => {
    const res = await fetch(`${base}/nope`, { headers: { 'x-request-id': 'trace-123' } });
    expect(res.status).toBe(404);
    expect(res.headers.get('x-request-id')).toBe('trace-123');
    expect((await res.json()).error.code).toBe('NOT_FOUND');
  });

  test('a body over 256 KB is refused', async () => {
    const res = await fetch(`${base}/api/v1/echo`, {
      method: 'POST',
      headers: { ...actor, 'x-api-key': 'test-key-one', 'content-type': 'application/json' },
      body: JSON.stringify({ articleText: 'x'.repeat(300_000) }),
    });
    expect(res.status).toBe(413);
  });
});
