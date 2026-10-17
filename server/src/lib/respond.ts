import type { Response } from 'express';
import type { Jsonify } from '../store/types.js';

/**
 * Answers with `body`, and only compiles when the body turns into the shared response type `Dto`
 * once JSON has run over it (store views hold Date objects, the wire holds ISO strings). A view
 * that drifts from @mern-blog/shared stops the build here instead of reaching a client.
 */
export function sendJson<Dto, Body>(
  res: Response<Dto>,
  status: number,
  body: Body,
  // Only there so the call fails to compile when the body is wrong; nothing reads it.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- type-level check only
  ..._matchesDto: Jsonify<Body> extends Dto ? [] : [error: 'body does not match the response type']
): void {
  // Express types res.json() by the wire type, but the body still holds Date objects until
  // JSON.stringify runs; the conditional parameter above is what proves the two agree.
  res.status(status).json(body as unknown as Dto);
}
