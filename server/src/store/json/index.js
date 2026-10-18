import { StoreError } from '../errors.js';
import { createFileDb, emptyState } from './file-db.js';
import { migrate } from './migrations.js';
import { createPostRepo } from './posts.js';
import { assertImportable, cleanEmail } from '../rules.js';
import { createUserRepo } from './users.js';
import { toRawUser, userIndex } from '../views.js';

const DATE_FIELDS = new Set(['passwordChangedAt', 'activationExpires', 'resetExpires', 'createdAt', 'updatedAt']);

/**
 * The JSON-file adapter.
 * @param {{DATA_DIR: string, BACKUP_KEEP?: number}} config
 * @param {object} [deps] test hooks: rename, now, lock, isAlive, pid, log, migrationSteps
 * @returns {import('../types.js').Store}
 */
export function createJsonStore(config, deps = {}) {
  const db = createFileDb({ dir: config.DATA_DIR, backupKeep: config.BACKUP_KEEP ?? 10, ...deps });

  const admin = {
    async exportAll() {
      return structuredClone(db.read());
    },

    async importAll(data, { replace = false } = {}) {
      if (!data || !Array.isArray(data.users) || !Array.isArray(data.posts)) {
        throw new StoreError('Import file must contain "users" and "posts" lists.');
      }
      const next = migrate(structuredClone(data), deps.migrationSteps);
      assertImportable(next);
      const current = db.read();
      if (!replace && (current.users.length > 0 || current.posts.length > 0)) {
        throw new StoreError('The store is not empty. Import with replace to overwrite it.');
      }
      await db.replace(next);
      return { users: next.users.length, posts: next.posts.length };
    },

    async reset() {
      await db.replace(emptyState());
    },

    async counts() {
      const state = db.read();
      return { users: state.users.length, posts: state.posts.length };
    },

    // The stored user including secrets, under the repo's own field names.
    async rawUserByEmail(email) {
      const record = userIndex(db.read()).byEmail.get(cleanEmail(email));
      return record ? toRawUser(record) : null;
    },

    // Overwrites stored fields as they are (tests use it to move expiry dates into the past).
    // A null or undefined value removes the field.
    patchUser: (id, fields) =>
      db.write((draft, tx) => {
        const record = draft.users.find((user) => user._id === id);
        if (!record) {
          tx.unchanged();
          return false;
        }
        for (const [key, value] of Object.entries(fields)) {
          if (value === undefined || value === null) delete record[key];
          else record[key] = DATE_FIELDS.has(key) ? new Date(value).toISOString() : value;
        }
        return true;
      }),
  };

  return {
    users: createUserRepo(db),
    posts: createPostRepo(db),
    admin,
    init: () => db.init(),
    close: () => db.close(),
    // Exposed for the durability tests and the import/export scripts.
    _db: db,
  };
}
