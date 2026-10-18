import type { User } from '../store/types.js';

// `protect` (modules/auth/controller.ts) sets req.user after it has checked the session. Handlers
// behind it read the user with requireUser(req) instead of asserting that it exists.
declare global {
  // Express publishes its request type as a global namespace; augmenting it is the documented way
  // to add a property.
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
