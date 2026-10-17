import { createJsonStore } from './json/index.js';

/**
 * Builds the store for `config.DB_DRIVER`. The store is not usable until `store.init()` has run.
 * @param {{DB_DRIVER: 'json'|'mongo', DATA_DIR: string, BACKUP_KEEP?: number}} config
 * @param {object} [deps] test hooks for the JSON adapter (rename, clock, lock)
 * @returns {Promise<import('./types.js').Store>}
 */
export async function createStore(config, deps) {
  switch (config.DB_DRIVER) {
    case 'json':
      return createJsonStore(config, deps);
    case 'mongo':
      // Loaded on demand so the JSON-only setup never needs a MongoDB driver.
      throw new Error('mongo driver is added in the next commit');
    default:
      throw new Error(`Unknown DB_DRIVER: ${config.DB_DRIVER}`);
  }
}
