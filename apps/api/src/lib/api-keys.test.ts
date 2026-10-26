import { describe, expect, test } from 'bun:test';
import { apiKeyFrom, isValidApiKey, keyFingerprint } from './api-keys';

describe('internal API keys', () => {
  test('accepts each configured key, so one can be rotated', () => {
    expect(isValidApiKey('test-key-one')).toBe(true);
    expect(isValidApiKey('test-key-two')).toBe(true);
  });

  test('refuses missing, empty and wrong keys', () => {
    expect(isValidApiKey(undefined)).toBe(false);
    expect(isValidApiKey('')).toBe(false);
    expect(isValidApiKey('test-key-on')).toBe(false);
  });

  test('reads the socket auth before the header', () => {
    expect(apiKeyFrom({ 'x-api-key': 'header' }, { apiKey: 'auth' })).toBe('auth');
    expect(apiKeyFrom({ 'x-api-key': 'header' })).toBe('header');
  });

  test('a fingerprint is short and does not contain the key', () => {
    const fp = keyFingerprint('test-key-one');
    expect(fp).toMatch(/^[0-9a-f]{6}$/);
    expect(fp).toBe(keyFingerprint('test-key-one'));
  });
});
