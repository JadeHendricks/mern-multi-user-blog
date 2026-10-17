import { isValidId } from '../lib/ids.js';
import { StoreError, StoreValidationError } from './errors.js';

// Field rules every adapter applies before it writes, so both reject the same input with the same
// message (the wording mirrors the Mongoose messages the API has always returned).
export const NAME_MAX = 32;
export const TITLE_MAX = 100;

export const cleanName = (value) => {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name) throw new StoreValidationError('Path `name` is required.');
  if (name.length > NAME_MAX) {
    throw new StoreValidationError(
      `Path \`name\` is longer than the maximum allowed length (${NAME_MAX}).`,
    );
  }
  return name;
};

export const cleanEmail = (value) => {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!email) throw new StoreValidationError('Path `email` is required.');
  return email;
};

export const requireHash = (value) => {
  if (typeof value !== 'string' || !value)
    throw new StoreValidationError('Path `passwordHash` is required.');
  return value;
};

export const cleanTitle = (value) => {
  const title = typeof value === 'string' ? value.trim() : '';
  if (!title) throw new StoreValidationError('Path `title` is required.');
  if (title.length > TITLE_MAX) {
    throw new StoreValidationError(
      `Path \`title\` is longer than the maximum allowed length (${TITLE_MAX}).`,
    );
  }
  return title;
};

export const cleanDescription = (value) => {
  if (typeof value !== 'string' || value === '')
    throw new StoreValidationError('Path `description` is required.');
  return value;
};

export const cleanComment = (value) => {
  if (typeof value !== 'string' || value === '')
    throw new StoreValidationError('Path `comment` is required.');
  return value;
};

// Checks an import before anything is replaced, so a bad file cannot half-load.
export function assertImportable(data) {
  const emails = new Set();
  const ids = new Set();
  for (const user of data.users) {
    if (!isValidId(user._id) || ids.has(user._id))
      throw new StoreError('Import has a missing or duplicate user id.');
    ids.add(user._id);
    const email = cleanEmail(user.email);
    if (emails.has(email)) throw new StoreError('Import has two users with the same email.');
    emails.add(email);
  }
  const postIds = new Set();
  for (const post of data.posts) {
    if (!isValidId(post._id) || postIds.has(post._id))
      throw new StoreError('Import has a missing or duplicate post id.');
    postIds.add(post._id);
  }
}
