import { randomBytes } from 'node:crypto';
import type {
  NewPendingUser,
  NewPost,
  PostInput,
  LikeResult,
  LikeView,
  Store,
  UnlikeResult,
  User,
  UserInput,
} from '../../../src/store/types.js';

// What a contract suite needs from an adapter: a fresh store and a way to throw it away.
export interface StoreHandle {
  store: Store;
  cleanup: () => Promise<void>;
}
export type MakeStore = () => Promise<StoreHandle>;

// Fake data for the contract suites. Hashes here are random hex, not real credentials.
export const hex = (length = 64): string => randomBytes(length / 2).toString('hex');

export const LONG_TEXT =
  'This description is long enough to satisfy the fifty character minimum of the validator.';

export const pendingInput = (
  n: number,
  overrides: Partial<NewPendingUser> = {},
): NewPendingUser => ({
  name: `User ${n}`,
  email: `user${n}@example.test`,
  passwordHash: `$2a$12$${hex(40)}`,
  activationHash: hex(),
  activationExpires: new Date(Date.now() + 60 * 60 * 1000),
  ...overrides,
});

// An active user, as the seed and import paths create them.
export const activeUser = (
  store: Store,
  n: number,
  overrides: Partial<UserInput> = {},
): Promise<User> =>
  store.users.create({
    name: `User ${n}`,
    email: `user${n}@example.test`,
    passwordHash: `$2a$12$${hex(40)}`,
    ...overrides,
  });

// With an author the input fits both `create` (NewPost) and `insertMany` (PostInput); without one
// (an imported post whose author is gone) only `insertMany` takes it.
export function postInput(user: string, overrides?: Partial<PostInput>): NewPost & PostInput;
export function postInput(user: undefined, overrides?: Partial<PostInput>): PostInput;
export function postInput(user: string | undefined, overrides: Partial<PostInput> = {}): PostInput {
  return {
    user,
    title: 'A title',
    description: LONG_TEXT,
    ...overrides,
  };
}

// The error a promise rejects with, or undefined when it resolves.
export const rejection = async (
  promise: Promise<unknown>,
): Promise<(Error & { code?: string }) | undefined> => {
  try {
    await promise;
  } catch (err) {
    return err as Error & { code?: string };
  }
  return undefined;
};

// The likes a like/unlike answer carries; any other answer (already, not-found) has none.
export function likesOf(result: LikeResult | UnlikeResult): LikeView[] {
  if (!('likes' in result)) throw new Error(`Expected likes, got ${result.status}.`);
  return result.likes;
}

// A value that must be there: a repo answers null or undefined for "not found", and a test that
// reads through one would otherwise fail with a TypeError instead of saying what was missing.
export function present<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('Expected a value, got nothing.');
  return value;
}
