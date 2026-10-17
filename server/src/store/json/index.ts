import { StoreError } from '../errors.js';
import { assertImportable, cleanEmail, parseDate } from '../rules.js';
import type { Store, StoreAdmin, StoreConfig } from '../types.js';
import { toRawUser, userIndex } from '../views.js';
import { createFileDb, emptyState } from './file-db.js';
import type { FileDb, JsonStoreDeps } from './file-db.js';
import { looksLikeDatabase, migrate } from './migrations.js';
import { createPostRepo } from './posts.js';
import { createUserRepo } from './users.js';

export type { JsonStoreDeps };

const DATE_FIELDS = new Set([
  'passwordChangedAt',
  'activationExpires',
  'resetExpires',
  'createdAt',
  'updatedAt',
]);

/** The JSON adapter also exposes its file database, for the durability tests and the scripts. */
export interface JsonStore extends Store {
  _db: FileDb;
}

/** The JSON-file adapter. `deps` are test hooks: rename, now, lock, isAlive, pid, log, migrationSteps. */
export function createJsonStore(
  config: Pick<StoreConfig, 'DATA_DIR' | 'BACKUP_KEEP'>,
  deps: JsonStoreDeps = {},
): JsonStore {
  const db = createFileDb({ dir: config.DATA_DIR, backupKeep: config.BACKUP_KEEP ?? 10, ...deps });

  const admin: StoreAdmin = {
    async exportAll() {
      return structuredClone(db.read());
    },

    // `data` is whatever file the caller read, so it is checked before it is trusted.
    async importAll(data: unknown, { replace = false } = {}) {
      if (!looksLikeDatabase(data)) {
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
        // Any stored field can be patched on purpose, so the keys are not checked against the type.
        for (const [key, value] of Object.entries(fields)) {
          if (value === undefined || value === null) Reflect.deleteProperty(record, key);
          else
            Reflect.set(record, key, DATE_FIELDS.has(key) ? parseDate(value).toISOString() : value);
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
