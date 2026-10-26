import express, { type Router } from 'express';
import pinoHttp from 'pino-http';
import { ApiError } from './lib/errors';
import { logger } from './lib/logger';
import { requireActor } from './middleware/actor';
import { errorHandler } from './middleware/error-handler';
import { requestId } from './middleware/request-id';
import { requireApiKey } from './middleware/require-api-key';
import { healthRouter } from './routes/health.routes';

export interface AppRouters {
  /** Mounted under /api/v1 after the key and actor checks. */
  api: Router[];
}

/**
 * The express app, without listening, so tests can drive it. Order matters: request id, logging,
 * JSON body (256 KB covers a 40,000-character article), health, then key, actor and routes.
 */
export function createApp(routers: AppRouters = { api: [] }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', false);

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as express.Request).id ?? 'unknown',
      customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
      serializers: {
        req: (req: { method: string; url: string; id: string }) => ({ method: req.method, url: req.url, id: req.id }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    })
  );
  app.use(express.json({ limit: '256kb' }));

  app.use(healthRouter);

  const api = express.Router();
  api.use(requireApiKey, requireActor);
  for (const router of routers.api) api.use(router);
  app.use('/api/v1', api);

  app.use((_req, _res, next) => next(ApiError.notFound('No such route.')));
  app.use(errorHandler);
  return app;
}
