import type { Actor } from '../middleware/actor';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      callerKeyId?: string;
      actor?: Actor;
    }
  }
}

export {};
