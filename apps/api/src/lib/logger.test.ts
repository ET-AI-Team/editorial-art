import { describe, expect, test } from 'bun:test';
import { Writable } from 'node:stream';
import { createLogger } from './logger';

describe('logger redaction', () => {
  test('keys, article text and prompts never reach the output', () => {
    const lines: string[] = [];
    const sink = new Writable({
      write(chunk, _enc, done) {
        lines.push(String(chunk));
        done();
      },
    });
    const log = createLogger('info', sink);
    log.info(
      {
        req: { headers: { 'x-api-key': 'sk-live-should-not-appear', authorization: 'Bearer abc' } },
        body: { articleText: 'Secret embargoed story', prompt: 'my private prompt' },
        provider: { apiKey: 'AIzaSecret', token: 'ghp_secret' },
      },
      'request_created'
    );
    const out = lines.join('');
    for (const secret of ['sk-live-should-not-appear', 'Bearer abc', 'Secret embargoed story', 'my private prompt', 'AIzaSecret', 'ghp_secret']) {
      expect(out).not.toContain(secret);
    }
    expect(out).toContain('request_created');
  });
});
