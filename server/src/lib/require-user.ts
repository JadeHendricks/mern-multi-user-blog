import type { Request } from 'express';
import type { User } from '../store/types.js';
import { UnauthorizedError } from './errors.js';

// The signed-in user of a request that went through `protect`.
export function requireUser(req: Pick<Request, 'user'>): User {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}
