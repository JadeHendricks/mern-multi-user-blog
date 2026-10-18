import validator from 'validator';
import { z } from 'zod';
import { DESCRIPTION_MIN, PASSWORD_MIN, SOCIAL_MAX } from './constants.js';

// Request-body schemas. They reproduce the express-validator chains the API shipped with (same
// rules, same messages, same "first failing rule wins" order), so swapping the validation library
// does not change a single answer. Parity traps that are copied on purpose:
//
// - A missing, null or non-string value is turned into text first (undefined and null become '',
//   numbers and booleans their string form, an object '[object Object]'), exactly like
//   express-validator, so `{ name: 5 }` passes the "not empty" rule.
// - An array is checked element by element, and an EMPTY array has nothing to check, so it passes.
// - "not empty" does not trim: '   ' is accepted.
// - The first failing rule of the first failing field (in declaration order) is the message.
// - `.not().isEmpty().isEmail().withMessage(m)` only attaches `m` to isEmail. The "not empty" rule
//   before it keeps express-validator's default text, 'Invalid value'.
//
// The schemas keep the original value of every field (they do not coerce), because the controllers
// already guard types themselves. Field values are therefore `unknown`; use the *Request types for
// what a well-behaved client sends.

const INVALID_VALUE = 'Invalid value';

type Rule = readonly [passes: (text: string) => boolean, message: string];

// express-validator's toString(): what a validator sees for a raw request value.
function toText(value: unknown, deep = true): string {
  if (Array.isArray(value) && value.length > 0 && deep) return toText(value[0] as unknown, false);
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.join(',');
  return '[object Object]';
}

/** Looks at one raw field value and returns the message of the first rule it breaks, or null. */
type Check = (value: unknown) => string | null;

/** One field: rules run in order, over every element when the value is an array. */
function field(rules: readonly Rule[]): Check {
  return (value) => {
    const values: unknown[] = Array.isArray(value) ? value : [value];
    for (const [passes, message] of rules) {
      if (values.some((item) => !passes(toText(item)))) return message;
    }
    return null;
  };
}

// A body that is not an object (for example an array) has no fields, like an empty body.
const asRecord = (raw: unknown): unknown =>
  typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw : {};

// Checks the fields in declaration order and reports the first broken rule of each. The parsed value
// IS the body that came in (same keys, same values, extra keys kept), so a middleware can pass it on
// as is. It is not a z.object on purpose: zod rejects a missing key whose value is `undefined`,
// while these rules must see it (a missing name has to answer 'Name is required').
function body(checks: Readonly<Record<string, Check>>) {
  return z.preprocess(
    asRecord,
    z.record(z.string(), z.unknown()).superRefine((value, ctx) => {
      for (const [key, check] of Object.entries<Check>(checks)) {
        const message = check(value[key]);
        if (message !== null) ctx.addIssue({ code: 'custom', message, path: [key] });
      }
    }),
  );
}
const notEmpty = (message: string): Rule => [(text) => !validator.isEmpty(text), message];
const email = (message: string): Rule => [(text) => validator.isEmail(text), message];
const minLength = (min: number, message: string): Rule => [
  (text) => validator.isLength(text, { min }),
  message,
];

const NAME_REQUIRED = 'Name is required';
const EMAIL_INVALID = 'Must be a valid email address';
const PASSWORD_SHORT = `Password must be atleast ${String(PASSWORD_MIN)} characters long`;
const TITLE_REQUIRED = 'Title is required.';
const DESCRIPTION_SHORT = `Description must be atleast ${String(DESCRIPTION_MIN)} characters long.`;
const INVALID_CREDENTIALS = 'Invalid Credentials';

const registerFields = {
  name: field([notEmpty(NAME_REQUIRED)]),
  email: field([email(EMAIL_INVALID)]),
  password: field([minLength(PASSWORD_MIN, PASSWORD_SHORT)]),
};
const loginFields = {
  email: field([email(INVALID_CREDENTIALS)]),
  password: field([minLength(PASSWORD_MIN, INVALID_CREDENTIALS)]),
};
const forgotPasswordFields = {
  email: field([notEmpty(INVALID_VALUE), email(EMAIL_INVALID)]),
};
const resetPasswordFields = {
  newPassword: field([notEmpty(INVALID_VALUE), minLength(PASSWORD_MIN, PASSWORD_SHORT)]),
  resetPasswordLink: field([notEmpty('Reset link is required')]),
};
// Create and edit share the same rules.
const postFields = {
  title: field([notEmpty(TITLE_REQUIRED)]),
  description: field([minLength(DESCRIPTION_MIN, DESCRIPTION_SHORT)]),
};
const addCommentFields = {
  comment: field([notEmpty('A comment is required.')]),
};
const updateMeFields = {
  name: field([notEmpty(NAME_REQUIRED)]),
};

// https-only, so a stored social link can never be a javascript: or http: URL. A falsy value
// (missing, null, '', 0, false) means "leave this link out" and skips every rule. Unlike the rules
// above, the type check looks at the raw value, so an array or an object is rejected as a whole.
const social =
  (name: string): Check =>
  (value) => {
    if (!value) return null;
    if (typeof value !== 'string') return `${name} link must be a text value`;
    if (!validator.isLength(value, { max: SOCIAL_MAX })) {
      return `${name} link must be at most ${String(SOCIAL_MAX)} characters`;
    }
    if (!validator.isURL(value, { protocols: ['https'], require_protocol: true })) {
      return `${name} link must be a valid https URL`;
    }
    return null;
  };
const updateSocialsFields = {
  facebook: social('facebook'),
  linkedin: social('linkedin'),
  twitter: social('twitter'),
};

export const registerRequestSchema = body(registerFields);
export const loginRequestSchema = body(loginFields);
export const forgotPasswordRequestSchema = body(forgotPasswordFields);
export const resetPasswordRequestSchema = body(resetPasswordFields);
export const createPostRequestSchema = body(postFields);
export const updatePostRequestSchema = body(postFields);
export const addCommentRequestSchema = body(addCommentFields);
export const updateMeRequestSchema = body(updateMeFields);
export const updateSocialsRequestSchema = body(updateSocialsFields);

// What a well-behaved client sends: every field is text. The schemas above accept more, on purpose
// (see the notes at the top), so these are derived from the field names only.
type TextFields<Fields> = { [Key in keyof Fields]: string };
export type RegisterRequest = TextFields<typeof registerFields>;
export type LoginRequest = TextFields<typeof loginFields>;
export type ForgotPasswordRequest = TextFields<typeof forgotPasswordFields>;
export type ResetPasswordRequest = TextFields<typeof resetPasswordFields>;
export type CreatePostRequest = TextFields<typeof postFields>;
export type UpdatePostRequest = TextFields<typeof postFields>;
export type AddCommentRequest = TextFields<typeof addCommentFields>;
export type UpdateMeRequest = TextFields<typeof updateMeFields>;
/** Only the links being changed are sent; '' clears one. */
export type UpdateSocialsRequest = Partial<TextFields<typeof updateSocialsFields>>;
