import { createJsonStore } from './json/index.js';
import type { Store, StoreConfig } from './types.js';
import type { JsonStoreDeps } from './json/index.js';

/**
 * Builds the store for `config.DB_DRIVER`. The store is not usable until `store.init()` has run.
 * `deps` are test hooks for the JSON adapter (rename, clock, lock).
 */
export async function createStore(config: StoreConfig, deps?: JsonStoreDeps): Promise<Store> {
  switch (config.DB_DRIVER) {
    case 'json':
      return createJsonStore(config, deps);
    case 'mongo':
      // Loaded on demand so the JSON-only setup never needs a MongoDB driver.
      return (await import('./mongo/index.js')).createMongoStore(config);
    default:
      // Only reachable from untyped callers (a config that skipped validation).
      throw new Error(`Unknown DB_DRIVER: ${String(config.DB_DRIVER satisfies never)}`);
  }
}
