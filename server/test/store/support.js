import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createJsonStore } from '../../src/store/json/index.js';

// A JSON store in its own temp folder. `deps` are the adapter's test hooks (rename, lock, ...).
export async function makeJsonStore({ deps, dir = mkdtempSync(path.join(tmpdir(), 'mern-blog-store-')), keep = 10, init = true } = {}) {
  const store = createJsonStore({ DATA_DIR: dir, BACKUP_KEEP: keep }, deps);
  if (init) await store.init();
  return {
    store,
    dir,
    cleanup: async () => {
      await store.close().catch(() => {});
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
