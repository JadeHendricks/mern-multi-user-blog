import fs from 'node:fs/promises';
import path from 'node:path';
import { StoreError } from '../errors.js';
import { createBackups } from './backup.js';
import {
  latestVersion,
  migrate,
  migrations as defaultMigrations,
  needsMigration,
  versionOf,
} from './migrations.js';
import { createQueue } from './queue.js';

// A whole-file JSON database: the committed state lives in memory and every change rewrites db.json.
// That is plenty for a personal blog (a few hundred KB at most); it is not meant for heavy traffic.
//
// Writes: queue -> clone the state into a draft -> run the change on the draft -> write
// db.json.<pid>.tmp -> fsync -> rename over db.json -> only then swap the draft in as the
// committed state. A change that throws, or fails to reach the disk, leaves memory and disk as they were.

const RETRYABLE = new Set(['EPERM', 'EBUSY', 'EACCES']);
const RENAME_ATTEMPTS = 8;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const emptyState = () => ({ schemaVersion: latestVersion(), users: [], posts: [] });

const processIsAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM: the process exists but belongs to someone else.
    return err.code === 'EPERM';
  }
};

export function createFileDb({
  dir,
  backupKeep = 10,
  migrationSteps = defaultMigrations,
  // Test hooks
  rename = fs.rename,
  now = Date.now,
  lock = true,
  isAlive = processIsAlive,
  pid = process.pid,
  log = console,
}) {
  const file = path.join(dir, 'db.json');
  const tmpFile = path.join(dir, `db.json.${pid}.tmp`);
  const lockFile = path.join(dir, '.lock');
  const backups = createBackups({ dir: path.join(dir, 'backups'), keep: backupKeep, now });
  const queue = createQueue();

  let state = null;
  let closed = false;
  let holdsLock = false;

  // --- lock: stops a second process (a seed run, a second server) from clobbering this one ---
  async function acquireLock() {
    if (!lock) return;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await fs.writeFile(lockFile, String(pid), { flag: 'wx' });
        holdsLock = true;
        return;
      } catch (err) {
        if (err.code !== 'EEXIST') throw err;
      }
      const holder = Number.parseInt(await fs.readFile(lockFile, 'utf8').catch(() => ''), 10);
      if (Number.isInteger(holder) && isAlive(holder)) {
        throw new StoreError(
          `The data folder is in use by process ${holder} (${lockFile}). Stop that process first. If it is not running, delete the .lock file.`,
        );
      }
      // Stale lock from a crashed process.
      await fs.rm(lockFile, { force: true });
    }
    throw new StoreError(`Could not take the data folder lock (${lockFile}).`);
  }

  async function releaseLock() {
    if (!holdsLock) return;
    holdsLock = false;
    await fs.rm(lockFile, { force: true });
  }

  // --- disk ---
  async function renameWithRetry(from, to) {
    for (let attempt = 1; ; attempt += 1) {
      try {
        await rename(from, to);
        return;
      } catch (err) {
        // On Windows (and inside OneDrive) a sync client or antivirus can hold db.json for a moment.
        if (!RETRYABLE.has(err.code) || attempt >= RENAME_ATTEMPTS) throw err;
        await sleep(Math.min(200, 20 * 2 ** (attempt - 1)));
      }
    }
  }

  async function persist(data) {
    const json = JSON.stringify(data, null, 2);
    try {
      const handle = await fs.open(tmpFile, 'w');
      try {
        await handle.writeFile(json, 'utf8');
        await handle.sync();
      } finally {
        await handle.close();
      }
      await renameWithRetry(tmpFile, file);
    } catch (err) {
      await fs.rm(tmpFile, { force: true }).catch(() => {});
      throw err;
    }
  }

  async function removeLeftoverTmpFiles() {
    for (const name of await fs.readdir(dir)) {
      if (/^db\.json\..*\.tmp$/.test(name)) await fs.rm(path.join(dir, name), { force: true });
    }
  }

  async function load() {
    let text;
    try {
      text = await fs.readFile(file, 'utf8');
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
    if (text === undefined || text.trim() === '') {
      state = emptyState();
      await persist(state);
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const newest = await backups.newest();
      throw new StoreError(
        `${file} is not valid JSON, so the server will not start (nothing was overwritten). ` +
          (newest ? `Restore the newest backup: ${newest}` : 'There is no backup to restore from.'),
      );
    }
    if (
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      ![data.users, data.posts].every(Array.isArray)
    ) {
      throw new StoreError(
        `${file} does not look like a blog database (expected "users" and "posts" lists).`,
      );
    }

    const willMigrate = needsMigration(data, migrationSteps);
    if (willMigrate) {
      // Refuses a file from a newer version before anything is touched.
      migrate(structuredClone(data), migrationSteps);
      // The safety copy is mandatory before changing the file's shape.
      await backups.backupNow(file, versionOf(data));
      state = migrate(data, migrationSteps);
      await persist(state);
    } else {
      migrate(data, migrationSteps); // only checks that the version is not newer
      state = data;
      await backups.backupQuietly(file, versionOf(data), log);
    }
  }

  const api = {
    file,
    backups,

    async init() {
      await fs.mkdir(dir, { recursive: true });
      await acquireLock();
      try {
        await removeLeftoverTmpFiles();
        await load();
      } catch (err) {
        await releaseLock();
        throw err;
      }
    },

    // The committed state. Treat it as read-only: changes go through write().
    read() {
      if (!state) throw new StoreError('The store is not initialised: call init() first.');
      return state;
    },

    // Runs `change(draft, tx)` in the queue. Return value is passed back to the caller. Call
    // tx.unchanged() to say nothing was modified, which skips the disk write.
    write(change) {
      return queue.enqueue(async () => {
        if (closed) throw new StoreError('The store is closed.');
        const draft = structuredClone(api.read());
        let changed = true;
        const result = await change(draft, {
          unchanged: () => {
            changed = false;
          },
        });
        if (changed) {
          // Copy the previous file first (at most every 10 minutes), then replace it.
          await backups.backupIfDue(file, versionOf(state), log);
          await persist(draft);
          state = draft;
        }
        return result;
      });
    },

    // Replaces the whole state in one write (reset and import).
    replace(next) {
      return api.write((draft) => {
        draft.schemaVersion = next.schemaVersion;
        draft.users = next.users;
        draft.posts = next.posts;
      });
    },

    async close() {
      if (closed) return;
      // Queued behind every pending write, so none of them is cut off.
      await queue.enqueue(async () => {
        closed = true;
      });
      await releaseLock();
    },
  };
  return api;
}
