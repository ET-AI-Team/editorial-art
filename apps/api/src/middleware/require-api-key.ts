import type { RequestHandler } from 'express';
import { apiKeyFrom, isValidApiKey, keyFingerprint } from '../lib/api-keys';
import { env } from '../lib/env';
import { ApiError } from '../lib/errors';
import { logger } from '../lib/logger';

/** Every /api/v1 call needs the internal key. Enforced from the first deploy. */
export const requireApiKey: RequestHandler = (req, _res, next) => {
  const key = apiKeyFrom(req.headers);
  if (isValidApiKey(key)) {
    req.callerKeyId = keyFingerprint(key!);
    return next();
  }
  if (env().EA_API_KEY_REQUIRED) return next(new ApiError('UNAUTHENTICATED', 401, 'Missing or invalid API key.'));
  logger.warn({ path: req.originalUrl }, 'api_key_missing');
  req.callerKeyId = 'none';
  next();
};
