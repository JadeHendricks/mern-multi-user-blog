import fs from 'node:fs/promises';
import path from 'node:path';
import { errorCode } from '../../lib/errors.js';
import { StoreError } from '../errors.js';
import { createBackups } from './backup.js';
import type { Backups, Logger } from './backup.js';
import {
  latestVersion,
  looksLikeDatabase,
  migrate,
  migrations as defaultMigrations,
  needsMigration,
  versionOf,
} from './migrations.js';
import type { Migration } from './migrations.js';
import { createQueue } from './queue.js';
import type { JsonState } from './records.js';

// A whole-file JSON database: the committed state lives in memory and every change rewrites db.json.
// That is plenty for a personal blog (a few hundred KB at most); it is not meant for heavy traffic.
//
// Writes: queue -> clone the state into a draft -> run the change on the draft -> write
// db.json.<pid>.tmp -> fsync -> rename over db.json -> only then swap the draft in as the
// committed state. A change that throws, or fails to reach the disk, leaves memory and disk as they were.

const RETRYABLE = new Set(['EPERM', 'EBUSY', 'EACCES']);
const RENAME_ATTEMPTS = 8;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const emptyState = (): JsonState => ({
  schemaVersion: latestVersion(),
  users: [],
  posts: [],
});

const processIsAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM: the process exists but belongs to someone else.
    return errorCode(err) === 'EPERM';
  }
};

/** Test hooks: everything but the folder and the backup count. */
export interface JsonStoreDeps {
  migrationSteps?: readonly Migration[];
  rename?: (from: string, to: string) => Promise<void>;
  now?: () => number;
  /** false skips the lock file (tests that open one folder twice). */
  lock?: boolean;
  isAlive?: (pid: number) => boolean;
  pid?: number;
  log?: Logger;
}

export interface FileDbOptions extends JsonStoreDeps {
  dir: string;
  backupKeep?: number;
}

/** Passed to a change: say nothing was modified to skip the disk write. */
export interface Transaction {
  unchanged(): void;
}

export interface FileDb {
  file: string;
  backups: Backups;
  init(): Promise<void>;
  /** The committed state. Treat it as read-only: changes go through write(). */
  read(): JsonState;
  /** Runs `change(draft, tx)` in the queue. Its return value is passed back to the caller. */
  write<T>(change: (draft: JsonState, tx: Transaction) => T | Promise<T>): Promise<T>;
  /** Replaces the whole state in one write (reset and import). */
  replace(next: JsonState): Promise<void>;
  close(): Promise<void>;
}

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
}: FileDbOptions): FileDb {
  const file = path.join(dir, 'db.json');
  const tmpFile = path.join(dir, `db.json.${pid}.tmp`);
  const lockFile = path.join(dir, '.lock');
  const backups = createBackups({ dir: path.join(dir, 'backups'), keep: backupKeep, now });
  const queue = createQueue();

  let state: JsonState | null = null;
  let closed = false;
  let holdsLock = false;

  // --- lock: stops a second process (a seed run, a second server) from clobbering this one ---
  async function acquireLock(): Promise<void> {
    if (!lock) return;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await fs.writeFile(lockFile, String(pid), { flag: 'wx' });
        holdsLock = true;
        return;
      } catch (err) {
        if (errorCode(err) !== 'EEXIST') throw err;
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

  async function releaseLock(): Promise<void> {
    if (!holdsLock) return;
    holdsLock = false;
    await fs.rm(lockFile, { force: true });
  }

  // --- disk ---
  async function renameWithRetry(from: string, to: string): Promise<void> {
    for (let attempt = 1; ; attempt += 1) {
      try {
        await rename(from, to);
        return;
      } catch (err) {
        // On Windows (and inside OneDrive) a sync client or antivirus can hold db.json for a moment.
        const code = errorCode(err);
        if (code === undefined || !RETRYABLE.has(code) || attempt >= RENAME_ATTEMPTS) throw err;
        await sleep(Math.min(200, 20 * 2 ** (attempt - 1)));
      }
    }
  }

  async function persist(data: JsonState): Promise<void> {
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
      await fs.rm(tmpFile, { force: true }).catch(() => undefined);
      throw err;
    }
  }

  async function removeLeftoverTmpFiles(): Promise<void> {
    for (const name of await fs.readdir(dir)) {
      if (/^db\.json\..*\.tmp$/.test(name)) await fs.rm(path.join(dir, name), { force: true });
    }
  }

  async function load(): Promise<void> {
    let text: string | undefined;
    try {
      text = await fs.readFile(file, 'utf8');
    } catch (err) {
      if (errorCode(err) !== 'ENOENT') throw err;
    }
    if (text === undefined || text.trim() === '') {
      state = emptyState();
      await persist(state);
      return;
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      const newest = await backups.newest();
      throw new StoreError(
        `${file} is not valid JSON, so the server will not start (nothing was overwritten). ` +
          (newest ? `Restore the newest backup: ${newest}` : 'There is no backup to restore from.'),
      );
    }
    if (!looksLikeDatabase(data)) {
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
      // Also checks that the version is not newer.
      state = migrate(data, migrationSteps);
      await backups.backupQuietly(file, versionOf(data), log);
    }
  }

  const api: FileDb = {
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

    read() {
      if (!state) throw new StoreError('The store is not initialised: call init() first.');
      return state;
    },

    write(change) {
      return queue.enqueue(async () => {
        if (closed) throw new StoreError('The store is closed.');
        const committed = api.read();
        const draft = structuredClone(committed);
        // An object, not a local `let`: the callback below sets it and the compiler cannot see that.
        const outcome = { changed: true };
        const result = await change(draft, {
          unchanged: () => {
            outcome.changed = false;
          },
        });
        if (outcome.changed) {
          // Copy the previous file first (at most every 10 minutes), then replace it.
          await backups.backupIfDue(file, versionOf(committed), log);
          await persist(draft);
          state = draft;
        }
        return result;
      });
    },

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
      await queue.enqueue(() => {
        closed = true;
      });
      await releaseLock();
    },
  };
  return api;
}
