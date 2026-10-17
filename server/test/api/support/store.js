import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { newId } from '../../../src/lib/ids.js';
import { createStore } from '../../../src/store/index.js';

// The API tests run on whichever driver TEST_DB_DRIVER names (json by default), so the same
// files exercise every adapter. Nothing here is specific to one database.
export const testDriver = () => process.env.TEST_DB_DRIVER ?? 'json';

// A store in its own folder under this run's DATA_DIR (support/env.js removes the whole run folder).
export async function createTestStore() {
  mkdirSync(process.env.DATA_DIR, { recursive: true });
  const dir = mkdtempSync(path.join(process.env.DATA_DIR, 'store-'));
  const store = await createStore({ DB_DRIVER: testDriver(), DATA_DIR: dir, BACKUP_KEEP: 10 });
  await store.init();
  return {
    store,
    dir,
    cleanup: async () => {
      await store.close().catch(() => {});
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

// Random valid id, so tests need no driver-specific id class.
export { newId };
