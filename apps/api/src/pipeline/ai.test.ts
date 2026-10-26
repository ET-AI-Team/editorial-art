import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { resetDb } from '../../test/db';
import { db } from '../lib/db';
import { resetEnvForTests } from '../lib/env';
import { SpendCapError, utcDay } from '../lib/spend-guard';
import { setProviders } from '../providers';
import { createFakeProviders } from '../providers/fake/fake-providers';
import { chat, generateImage } from './ai';

beforeEach(async () => {
  await resetDb();
  setProviders(createFakeProviders());
});

afterAll(async () => {
  delete process.env.EA_DAILY_SPEND_CAP_INR;
  resetEnvForTests();
  await db.$disconnect();
});

const Judge = z.object({ hasText: z.boolean() }).passthrough();

describe('instrumented model calls', () => {
  test('a chat call records an Attempt with its cost and adds it to today', async () => {
    await chat({ stage: 'judge' }, { kind: 'judge', model: 'gpt-4.1', system: 's', user: 'u' }, Judge);
    const attempts = await db.attempt.findMany();
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({ stage: 'judge', result: 'OK', provider: 'fake' });
    const ledger = await db.spendLedger.findUnique({ where: { day: utcDay() } });
    expect(Number(ledger?.costInr)).toBeCloseTo(Number(attempts[0]!.costInr), 4);
  });

  test('an answer in the wrong shape is a failed attempt whose cost still counts', async () => {
    const Strict = z.object({ nope: z.string() }).strict();
    await expect(chat({ stage: 'judge' }, { kind: 'judge', model: 'gpt-4.1', system: 's', user: 'u' }, Strict)).rejects.toThrow(/expected shape/);
    const [attempt] = await db.attempt.findMany();
    expect(attempt).toMatchObject({ result: 'ERROR', errorCode: 'BAD_MODEL_OUTPUT' });
    expect(Number(attempt!.costInr)).toBeGreaterThan(0);
  });

  test('a refusal is recorded as REFUSED at no cost', async () => {
    await expect(
      generateImage({ stage: 'preview' }, { provider: 'gemini', model: 'gemini-3.1-flash-image', prompt: 'FAKE_REFUSE', images: [], aspectRatio: '1:1' }, 8)
    ).rejects.toThrow(/declined/);
    const [attempt] = await db.attempt.findMany();
    expect(attempt).toMatchObject({ result: 'REFUSED', errorCode: 'PROVIDER_REFUSED' });
    expect(Number(attempt!.costInr)).toBe(0);
  });

  test('the daily cap stops a call before it is made', async () => {
    process.env.EA_DAILY_SPEND_CAP_INR = '5';
    resetEnvForTests();
    const fake = createFakeProviders();
    setProviders(fake);
    await expect(
      generateImage({ stage: 'preview' }, { provider: 'gemini', model: 'gemini-3.1-flash-image', prompt: 'p', images: [], aspectRatio: '1:1' }, 8)
    ).rejects.toBeInstanceOf(SpendCapError);
    expect(fake.calls).toHaveLength(0);
    delete process.env.EA_DAILY_SPEND_CAP_INR;
    resetEnvForTests();
  });
});
