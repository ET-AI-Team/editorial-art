import type { RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { ApiError } from '../lib/errors';

/** Parses the body (or query) with a schema; failures become VALIDATION_ERROR with field errors. */
export function validateBody<S extends ZodTypeAny>(schema: S): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(ApiError.validation(result.error.flatten()));
    req.body = result.data as z.infer<S>;
    next();
  };
}

export function parseQuery<S extends ZodTypeAny>(schema: S, query: unknown): z.infer<S> {
  const result = schema.safeParse(query);
  if (!result.success) throw ApiError.validation(result.error.flatten());
  return result.data;
}
