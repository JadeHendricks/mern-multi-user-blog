import { createTestStore, newId } from './store.js';

// One store per test file: connectDb in beforeAll, clearDb between tests, disconnectDb in afterAll.
let current;

export async function connectDb() {
  current = await createTestStore();
}

export async function clearDb() {
  await current.store.admin.reset();
}

export async function disconnectDb() {
  await current?.cleanup();
  current = undefined;
}

// The store of the current test file, and the folder it keeps its data in.
export function getStore() {
  if (!current) throw new Error('No test store: call connectDb() first.');
  return current.store;
}

export const getStoreDir = () => current.dir;
// The in-memory Mongo database of the current store (mongo driver only).
export const getStoreMongoUri = () => current.mongoUri;

export { newId };
