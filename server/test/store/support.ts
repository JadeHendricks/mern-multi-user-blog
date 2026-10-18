import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createJsonStore } from '../../src/store/json/index.js';
import type { JsonStore, JsonStoreDeps } from '../../src/store/json/index.js';
import { createMongoStore } from '../../src/store/mongo/index.js';
import type { MongoStore } from '../../src/store/mongo/index.js';
import { freshMongoUri } from '../support/mongo.js';

// A JSON store in its own temp folder. `deps` are the adapter's test hooks (rename, lock, ...).
export async function makeJsonStore({
  deps,
  dir = mkdtempSync(path.join(tmpdir(), 'mern-blog-store-')),
  keep = 10,
  init = true,
}: {
  deps?: JsonStoreDeps;
  dir?: string;
  keep?: number;
  init?: boolean;
} = {}): Promise<{ store: JsonStore; dir: string; cleanup: () => Promise<void> }> {
  const store = createJsonStore({ DATA_DIR: dir, BACKUP_KEEP: keep }, deps);
  if (init) await store.init();
  return {
    store,
    dir,
    cleanup: async () => {
      await store.close().catch(() => undefined);
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

// A Mongo store on its own database of the in-memory server; the database is dropped on cleanup.
export async function makeMongoStore(): Promise<{
  store: MongoStore;
  cleanup: () => Promise<void>;
}> {
  const store = createMongoStore({ MONGO_URI: await freshMongoUri() });
  await store.init();
  return {
    store,
    cleanup: async () => {
      await store._instance.connection.dropDatabase().catch(() => undefined);
      await store.close().catch(() => undefined);
    },
  };
}
