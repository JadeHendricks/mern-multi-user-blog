import type { RawUser, Store } from '../../../src/store/types.js';
import { createTestStore, newId } from './store.js';
import type { TestStore } from './store.js';

// One store per test file: connectDb in beforeAll, clearDb between tests, disconnectDb in afterAll.
let current: TestStore | undefined;

function requireCurrent(): TestStore {
  if (!current) throw new Error('No test store: call connectDb() first.');
  return current;
}

export async function connectDb(): Promise<void> {
  current = await createTestStore();
}

export async function clearDb(): Promise<void> {
  await requireCurrent().store.admin.reset();
}

export async function disconnectDb(): Promise<void> {
  await current?.cleanup();
  current = undefined;
}

// The store of the current test file, and the folder it keeps its data in.
export function getStore(): Store {
  return requireCurrent().store;
}

export const getStoreDir = (): string => requireCurrent().dir;

// The stored user including secrets; throws when there is none, so a test never reads through null.
export async function rawUser(email: string): Promise<RawUser> {
  const raw = await getStore().admin.rawUserByEmail(email);
  if (!raw) throw new Error(`No stored user for ${email}.`);
  return raw;
}

// The in-memory Mongo database of the current store (mongo driver only).
export const getStoreMongoUri = (): string | undefined => requireCurrent().mongoUri;

export { newId };
