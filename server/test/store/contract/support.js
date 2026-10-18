import { randomBytes } from 'node:crypto';

// Fake data for the contract suites. Hashes here are random hex, not real credentials.
export const hex = (length = 64) => randomBytes(length / 2).toString('hex');

export const LONG_TEXT = 'This description is long enough to satisfy the fifty character minimum of the validator.';

export const pendingInput = (n, overrides = {}) => ({
  name: `User ${n}`,
  email: `user${n}@example.test`,
  passwordHash: `$2a$12$${hex(40)}`,
  activationHash: hex(),
  activationExpires: new Date(Date.now() + 60 * 60 * 1000),
  ...overrides,
});

// An active user, as the seed and import paths create them.
export const activeUser = (store, n, overrides = {}) =>
  store.users.create({
    name: `User ${n}`,
    email: `user${n}@example.test`,
    passwordHash: `$2a$12$${hex(40)}`,
    ...overrides,
  });

export const postInput = (user, overrides = {}) => ({
  user,
  title: 'A title',
  description: LONG_TEXT,
  ...overrides,
});

export const rejection = async (promise) => {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  return undefined;
};
