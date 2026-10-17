import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { newId } from '../../../src/lib/ids.js';
import { createStore } from '../../../src/store/index.js';
import type { MongoStore } from '../../../src/store/mongo/index.js';
import type { Store } from '../../../src/store/types.js';
import { freshMongoUri } from '../../support/mongo.js';

// The API tests run on whichever driver TEST_DB_DRIVER names (json by default), so the same
// files exercise every adapter. Nothing here is specific to one database.
export function testDriver(): 'json' | 'mongo' {
  const driver = process.env.TEST_DB_DRIVER ?? 'json';
  if (driver !== 'json' && driver !== 'mongo') {
    throw new Error(`TEST_DB_DRIVER must be json or mongo, got ${driver}`);
  }
  return driver;
}

// This run's DATA_DIR, which support/env.ts sets before any test file loads.
export function dataDir(): string {
  const dir = process.env.DATA_DIR;
  if (!dir) throw new Error('DATA_DIR is not set: test/api/support/env.ts has not run.');
  return dir;
}

// The Mongo adapter keeps its mongoose instance on the store; the JSON adapter has none.
export const isMongoStore = (store: Store): store is MongoStore => '_instance' in store;

export interface TestStore {
  store: Store;
  dir: string;
  mongoUri: string | undefined;
  cleanup: () => Promise<void>;
}

// A store in its own folder under this run's DATA_DIR (support/env.ts removes the whole run folder).
// With the mongo driver the store also gets its own database on the in-memory server.
export async function createTestStore(): Promise<TestStore> {
  mkdirSync(dataDir(), { recursive: true });
  const dir = mkdtempSync(path.join(dataDir(), 'store-'));
  const driver = testDriver();
  const mongoUri = driver === 'mongo' ? await freshMongoUri() : undefined;
  const store = await createStore({
    DB_DRIVER: driver,
    DATA_DIR: dir,
    BACKUP_KEEP: 10,
    MONGO_URI: mongoUri,
  });
  await store.init();
  return {
    store,
    dir,
    mongoUri,
    cleanup: async () => {
      if (isMongoStore(store))
        await store._instance.connection.dropDatabase().catch(() => undefined);
      await store.close().catch(() => undefined);
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

// Random valid id, so tests need no driver-specific id class.
export { newId };
