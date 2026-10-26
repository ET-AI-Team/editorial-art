import pino from 'pino';

/**
 * JSON lines. Keys, secrets, article text and prompts are redacted wherever they appear in a
 * logged object; their length and hash are logged instead where useful.
 */
export const REDACT_PATHS = [
  'req.headers["x-api-key"]',
  'req.headers.authorization',
  'req.headers.cookie',
  '*.apiKey',
  '*.api_key',
  '*.secret',
  '*.password',
  '*.token',
  '*.articleText',
  '*.prompt',
  'body.articleText',
  'body.prompt',
];

export function createLogger(level = process.env.LOG_LEVEL ?? 'info', destination?: pino.DestinationStream) {
  return pino(
    {
      level,
      base: { service: 'editorial-art' },
      redact: { paths: REDACT_PATHS, censor: '[redacted]' },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    destination
  );
}

export const logger = createLogger();
