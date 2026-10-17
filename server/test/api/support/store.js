import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { newId } from '../../../src/lib/ids.js';
import { createStore } from '../../../src/store/index.js';
import { freshMongoUri } from '../../support/mongo.js';

// The API tests run on whichever driver TEST_DB_DRIVER names (json by default), so the same
// files exercise every adapter. Nothing here is specific to one database.
export const testDriver = () => process.env.TEST_DB_DRIVER ?? 'json';

// A store in its own folder under this run's DATA_DIR (support/env.js removes the whole run folder).
// With the mongo driver the store also gets its own database on the in-memory server.
export async function createTestStore() {
  mkdirSync(process.env.DATA_DIR, { recursive: true });
  const dir = mkdtempSync(path.join(process.env.DATA_DIR, 'store-'));
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
      if (driver === 'mongo') await store._instance.connection.dropDatabase().catch(() => {});
      await store.close().catch(() => {});
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

// Random valid id, so tests need no driver-specific id class.
export { newId };
