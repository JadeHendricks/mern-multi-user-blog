import { NAME_MAX, TITLE_MAX } from '@mern-blog/shared';
import { isValidId } from '../lib/ids.js';
import { StoreError, StoreValidationError } from './errors.js';
import type { PostRecord, UserRecord } from './records.js';

// Field rules every adapter applies before it writes, so both reject the same input with the same
// message (the wording mirrors the Mongoose messages the API has always returned). The limits
// come from @mern-blog/shared. The inputs are `unknown` on purpose: callers (seed and import files)
// are not trusted to have the right types, and a wrong type is a "required" error like a missing one.

export const cleanName = (value: unknown): string => {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name) throw new StoreValidationError('Path `name` is required.');
  if (name.length > NAME_MAX) {
    throw new StoreValidationError(
      `Path \`name\` is longer than the maximum allowed length (${NAME_MAX}).`,
    );
  }
  return name;
};

export const cleanEmail = (value: unknown): string => {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!email) throw new StoreValidationError('Path `email` is required.');
  return email;
};

export const requireHash = (value: unknown): string => {
  if (typeof value !== 'string' || !value)
    throw new StoreValidationError('Path `passwordHash` is required.');
  return value;
};

export const cleanTitle = (value: unknown): string => {
  const title = typeof value === 'string' ? value.trim() : '';
  if (!title) throw new StoreValidationError('Path `title` is required.');
  if (title.length > TITLE_MAX) {
    throw new StoreValidationError(
      `Path \`title\` is longer than the maximum allowed length (${TITLE_MAX}).`,
    );
  }
  return title;
};

export const cleanDescription = (value: unknown): string => {
  if (typeof value !== 'string' || value === '')
    throw new StoreValidationError('Path `description` is required.');
  return value;
};

export const cleanComment = (value: unknown): string => {
  if (typeof value !== 'string' || value === '')
    throw new StoreValidationError('Path `comment` is required.');
  return value;
};

// A Date from a Date, an ISO string or a timestamp (what import files and test patches carry).
export const parseDate = (value: unknown): Date =>
  new Date(value instanceof Date || typeof value === 'number' ? value : String(value));

// `value`, or the fallback when it is missing or empty ('' falls back too, which `??` would not do).
export const orDefault = (value: string | null | undefined, fallback: string): string =>
  typeof value === 'string' && value !== '' ? value : fallback;

// Checks an import before anything is replaced, so a bad file cannot half-load.
export function assertImportable(data: {
  users: readonly Pick<UserRecord, '_id' | 'email'>[];
  posts: readonly Pick<PostRecord, '_id'>[];
}): void {
  const emails = new Set<string>();
  const ids = new Set<string>();
  for (const user of data.users) {
    if (!isValidId(user._id) || ids.has(user._id))
      throw new StoreError('Import has a missing or duplicate user id.');
    ids.add(user._id);
    const email = cleanEmail(user.email);
    if (emails.has(email)) throw new StoreError('Import has two users with the same email.');
    emails.add(email);
  }
  const postIds = new Set<string>();
  for (const post of data.posts) {
    if (!isValidId(post._id) || postIds.has(post._id))
      throw new StoreError('Import has a missing or duplicate post id.');
    postIds.add(post._id);
  }
}
