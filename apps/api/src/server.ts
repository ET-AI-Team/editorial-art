import { createServer } from 'node:http';
import { createApp } from './app';
import { db } from './lib/db';
import { env } from './lib/env';
import { logger } from './lib/logger';
import { closeRedis } from './lib/redis';
import { startReaper, stopReaper } from './pipeline/reaper';
import { closeQueues } from './queues/queues';
import { attachSocketServer, closeSocketServer } from './realtime/socket-server';
import { adminRouter } from './routes/admin.routes';
import { optionsRouter } from './routes/options.routes';
import { requestsRouter } from './routes/requests.routes';
import { stylesRouter } from './routes/styles.routes';
import { processLibraryJob } from './workers/library.worker';
import { startWorkers, stopWorkers } from './workers/index';

/**
 * One process: HTTP, Socket.IO, the BullMQ workers and the reaper (EA_ROLE=all, the default), the
 * same shape as design-pipeline. EA_ROLE=api or worker splits them if load ever needs it.
 */

const config = env();
const role = config.EA_ROLE;

const app = role === 'worker' ? createApp() : createApp({ api: [requestsRouter, optionsRouter, stylesRouter, adminRouter] });
const http = createServer(app);
if (role !== 'worker') attachSocketServer(http);
if (role !== 'api') {
  startWorkers(processLibraryJob);
  startReaper();
}

const port = role === 'worker' ? config.EA_WORKER_HEALTH_PORT : config.EA_PORT;
http.listen(port, config.EA_HOST, () => logger.info({ host: config.EA_HOST, port, role }, 'server_started'));

let stopping = false;
async function shutdown(signal: string): Promise<void> {
  if (stopping) return;
  stopping = true;
  logger.info({ signal }, 'server_stopping');
  const forced = setTimeout(() => process.exit(1), 35_000);
  http.close();
  stopReaper();
  await stopWorkers().catch((err) => logger.error({ err }, 'workers_stop_failed'));
  await closeSocketServer();
  await closeQueues();
  await db.$disconnect();
  await closeRedis();
  clearTimeout(forced);
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('unhandledRejection', (err) => logger.error({ err }, 'unhandled_rejection'));
