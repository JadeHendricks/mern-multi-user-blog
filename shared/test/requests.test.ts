import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
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
} from '../src/index.js';
import * as legacy from './legacy-cases.js';

// What the API answers for a body: the message of the first failing rule, or null when it passes.
function firstMessage(schema: z.ZodType, body: unknown): string | null {
  const result = schema.safeParse(body);
  return result.success ? null : (result.error.issues[0]?.message ?? '(no message)');
}

// Every row was recorded from the express-validator chains these schemas replace. A mismatch means
// the schema answers differently from the API that shipped, which is an API change.
const routes: readonly [string, z.ZodType, readonly legacy.Row[]][] = [
  ['register', registerRequestSchema, legacy.register],
  ['login', loginRequestSchema, legacy.login],
  ['forgot password', forgotPasswordRequestSchema, legacy.forgotPassword],
  ['reset password', resetPasswordRequestSchema, legacy.resetPassword],
  ['create post', createPostRequestSchema, legacy.createPost],
  ['update post', updatePostRequestSchema, legacy.updatePost],
  ['add comment', addCommentRequestSchema, legacy.addComment],
  ['update me', updateMeRequestSchema, legacy.updateMe],
  ['update socials', updateSocialsRequestSchema, legacy.updateSocials],
];

describe('request schemas match the recorded express-validator behaviour', () => {
  for (const [name, schema, rows] of routes) {
    it(`${name}: ${String(rows.length)} recorded bodies`, () => {
      const mismatches = rows
        .map(([body, expected]) => ({ body, expected, actual: firstMessage(schema, body) }))
        .filter((row) => row.actual !== row.expected);
      expect(mismatches).toEqual([]);
    });
  }
});

describe('request schema messages', () => {
  const longEnough = 'a'.repeat(50);

  it('register', () => {
    const good = { name: 'Ann', email: 'a@b.co', password: '123456' };
    expect(firstMessage(registerRequestSchema, good)).toBeNull();
    expect(firstMessage(registerRequestSchema, { ...good, name: '' })).toBe('Name is required');
    expect(firstMessage(registerRequestSchema, { ...good, email: 'x' })).toBe(
      'Must be a valid email address',
    );
    expect(firstMessage(registerRequestSchema, { ...good, password: '12345' })).toBe(
      'Password must be atleast 6 characters long',
    );
    // the first failing field in declaration order wins
    expect(firstMessage(registerRequestSchema, { name: '', email: 'x', password: '1' })).toBe(
      'Name is required',
    );
  });

  it('login hides which field was wrong', () => {
    expect(firstMessage(loginRequestSchema, { email: 'x', password: '123456' })).toBe(
      'Invalid Credentials',
    );
    expect(firstMessage(loginRequestSchema, { email: 'a@b.co', password: '1' })).toBe(
      'Invalid Credentials',
    );
  });

  it('forgot and reset password keep the default text of the unlabelled rule', () => {
    expect(firstMessage(forgotPasswordRequestSchema, { email: '' })).toBe('Invalid value');
    expect(firstMessage(forgotPasswordRequestSchema, { email: 'x' })).toBe(
      'Must be a valid email address',
    );
    expect(
      firstMessage(resetPasswordRequestSchema, { newPassword: '', resetPasswordLink: 't' }),
    ).toBe('Invalid value');
    expect(
      firstMessage(resetPasswordRequestSchema, { newPassword: '12', resetPasswordLink: 't' }),
    ).toBe('Password must be atleast 6 characters long');
    expect(firstMessage(resetPasswordRequestSchema, { newPassword: '123456' })).toBe(
      'Reset link is required',
    );
  });

  it('posts and comments', () => {
    for (const schema of [createPostRequestSchema, updatePostRequestSchema]) {
      expect(firstMessage(schema, { title: 'T', description: longEnough })).toBeNull();
      expect(firstMessage(schema, { title: '', description: longEnough })).toBe(
        'Title is required.',
      );
      expect(firstMessage(schema, { title: 'T', description: 'short' })).toBe(
        'Description must be atleast 50 characters long.',
      );
    }
    expect(firstMessage(addCommentRequestSchema, { comment: '' })).toBe('A comment is required.');
  });

  it('profile name', () => {
    expect(firstMessage(updateMeRequestSchema, { name: '' })).toBe('Name is required');
  });

  it('socials accept https links only and skip empty values', () => {
    expect(firstMessage(updateSocialsRequestSchema, {})).toBeNull();
    expect(firstMessage(updateSocialsRequestSchema, { twitter: '' })).toBeNull();
    expect(
      firstMessage(updateSocialsRequestSchema, { twitter: 'https://twitter.com/me' }),
    ).toBeNull();
    expect(firstMessage(updateSocialsRequestSchema, { twitter: 'http://twitter.com/me' })).toBe(
      'twitter link must be a valid https URL',
    );
    expect(firstMessage(updateSocialsRequestSchema, { facebook: 'javascript:alert(1)' })).toBe(
      'facebook link must be a valid https URL',
    );
    expect(firstMessage(updateSocialsRequestSchema, { linkedin: 5 })).toBe(
      'linkedin link must be a text value',
    );
    expect(
      firstMessage(updateSocialsRequestSchema, { linkedin: `https://x.test/${'a'.repeat(200)}` }),
    ).toBe('linkedin link must be at most 200 characters');
  });

  it('a body that is not an object counts as an empty body', () => {
    expect(firstMessage(registerRequestSchema, undefined)).toBe('Name is required');
    expect(firstMessage(registerRequestSchema, [])).toBe('Name is required');
    expect(firstMessage(registerRequestSchema, 'text')).toBe('Name is required');
  });

  it('keeps the original values and unknown keys of a valid body', () => {
    const body = { name: 'Ann', email: 'a@b.co', password: '123456', extra: 1 };
    expect(registerRequestSchema.parse(body)).toEqual(body);
  });
});
