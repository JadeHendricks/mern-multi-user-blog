import {
  addCommentRequestSchema,
  createPostRequestSchema,
  forgotPasswordRequestSchema,
  loginRequestSchema,
  registerRequestSchema,
  resetPasswordRequestSchema,
  updateMeRequestSchema,
  updatePostRequestSchema,
  updateSocialsRequestSchema,
} from '@mern-blog/shared';
import type { Request, Response } from 'express';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import * as recorded from '../../../shared/test/legacy-cases.js';
import { validateBody } from '../../src/lib/validate.js';

// The request validation used to be express-validator chains (modules/*/schema.js, run by
// lib/validate.js). Before those were deleted, every body below was run through BOTH the chains and
// validateBody, and all of them answered identically. The chains are gone, so the answers that were
// recorded from them (shared/test/legacy-cases.ts) are the reference now: each row is the body and
// the message of the first rule it breaks, or null when the old API let it through.
// Do not edit a recorded answer to make a test pass: a different answer is an API change.
const routes: [name: string, rows: readonly recorded.Row[], schema: z.ZodType][] = [
  ['register', recorded.register, registerRequestSchema],
  ['login', recorded.login, loginRequestSchema],
  ['forgot password', recorded.forgotPassword, forgotPasswordRequestSchema],
  ['reset password', recorded.resetPassword, resetPasswordRequestSchema],
  ['create post', recorded.createPost, createPostRequestSchema],
  ['update post', recorded.updatePost, updatePostRequestSchema],
  ['add comment', recorded.addComment, addCommentRequestSchema],
  ['update me', recorded.updateMe, updateMeRequestSchema],
  ['update socials', recorded.updateSocials, updateSocialsRequestSchema],
];

interface Outcome {
  status: number;
  message: string | null;
  /** True when the request was handed on to the next handler. */
  passed: boolean;
  body: unknown;
}

/** Runs the middleware on a request double and records how it answered. */
function run(schema: z.ZodType, req: Record<string, unknown>): Outcome {
  const outcome: Outcome = { status: 200, message: null, passed: false, body: req.body };
  const res = {
    status(code: number) {
      outcome.status = code;
      return res;
    },
    json(payload: { message: string }) {
      outcome.message = payload.message;
      return res;
    },
  };
  validateBody(schema)(req as unknown as Request, res as unknown as Response, () => {
    outcome.passed = true;
    outcome.body = req.body;
  });
  return outcome;
}

describe('validateBody answers like the express-validator chains it replaced', () => {
  for (const [name, rows, schema] of routes) {
    it(`${name}: ${String(rows.length)} recorded bodies`, () => {
      const different = rows
        .map(([body, message]) => ({ body, message, answer: run(schema, { body }) }))
        .filter(({ message, answer }) =>
          message === null
            ? !answer.passed || answer.status !== 200
            : answer.passed || answer.status !== 422 || answer.message !== message,
        );
      expect(different).toEqual([]);
    });
  }

  it('treats a missing body like an empty one', () => {
    for (const [, rows, schema] of routes) {
      const emptyBody = rows.find(([body]) => JSON.stringify(body) === '{}');
      const expected = emptyBody?.[1] ?? null;
      expect(run(schema, {}).message).toBe(expected);
      expect(run(schema, {}).message).toBe(run(schema, { body: {} }).message);
    }
  });

  it('hands a valid body on unchanged', () => {
    const body = { name: 'Ann', email: 'ann@example.test', password: '123456', extra: 1 };
    const answer = run(registerRequestSchema, { body });
    expect(answer.passed).toBe(true);
    expect(answer.body).toEqual(body);
  });

  // express-validator's check() also read the query string, cookies, headers and route params, so
  // `?email=x` failed a login whose body was fine, and `?name=` was checked on PUT /user/me. Only
  // the body is the contract, so only the body is validated now.
  it('reads the body only, not the query string', () => {
    const answer = run(loginRequestSchema, {
      body: { email: 'ann@example.test', password: '123456' },
      query: { email: 'not-an-email', password: '1' },
      headers: { email: 'not-an-email' },
    });
    expect(answer.passed).toBe(true);
  });
});
