import { PrismaClient } from '@prisma/client';

/** One Prisma client per process. */
export const db = new PrismaClient({
  log: [
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
  ],
});

export type Db = typeof db;
