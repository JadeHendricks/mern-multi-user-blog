import type { RequestHandler } from 'express';
import type { z } from 'zod';

// express-validator's own wording for a rule that has no message of its own. Only reachable if a
// schema fails without an issue, which the shared request schemas never do.
const FALLBACK_MESSAGE = 'Invalid value';

/**
 * Checks the request body against one of the request schemas in @mern-blog/shared.
 *
 * - A broken rule answers 422 `{ message }` with the message of the FIRST broken rule, the same
 *   answer the express-validator chains gave (the schemas keep their rule order).
 * - Otherwise the parsed body replaces `req.body` and the request moves on. The shared schemas hand
 *   the body back unchanged (they check it, they do not reshape it).
 *
 * Only the body is read. (express-validator's `check()` also looked at the query string, cookies,
 * headers and route params, so `?email=x` could fail a login whose body was fine.)
 */
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, res, next) => {
    // Express 5 leaves req.body undefined when nothing was parsed.
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      res.status(422).json({ message: result.error.issues[0]?.message ?? FALLBACK_MESSAGE });
      return;
    }
    req.body = result.data;
    next();
  };
}
