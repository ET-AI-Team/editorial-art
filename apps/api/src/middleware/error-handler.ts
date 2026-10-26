import type { ErrorRequestHandler } from 'express';
import { ApiError, StageError } from '../lib/errors';
import { logger } from '../lib/logger';
import { SpendCapError } from '../lib/spend-guard';

/** The one error envelope. Unexpected errors are logged in full and answered without detail. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, ...(err.details !== undefined ? { details: err.details } : {}) } });
    return;
  }
  if (err instanceof SpendCapError) {
    res.status(429).json({ error: { code: err.code, message: err.message, details: { scope: err.scope } } });
    return;
  }
  if (err instanceof StageError) {
    res.status(409).json({ error: { code: err.code, message: err.message } });
    return;
  }
  // body-parser errors carry a status and a type.
  const status = (err as { status?: number }).status;
  if (status === 413) {
    res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'The request body is too large.' } });
    return;
  }
  if (status === 400 && (err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'The request body is not valid JSON.' } });
    return;
  }
  logger.error({ err, requestId: req.id, path: req.originalUrl }, 'unhandled_error');
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: `Something went wrong. Try again, and quote ${req.id ?? 'this request'} if it keeps happening.` },
  });
};
