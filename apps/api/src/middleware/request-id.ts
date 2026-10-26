import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

/** Echoes a caller's x-request-id (when sane) or makes one; every log line carries it. */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.header('x-request-id');
  const id = incoming && /^[A-Za-z0-9_.:-]{1,100}$/.test(incoming) ? incoming : randomUUID();
  req.id = id;
  res.setHeader('x-request-id', id);
  next();
};
