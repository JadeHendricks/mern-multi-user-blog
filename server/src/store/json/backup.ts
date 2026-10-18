import fs from 'node:fs/promises';
import path from 'node:path';
import { errorCode, errorMessage } from '../../lib/errors.js';

const NAME = /^db-.*\.json$/;

/** Where backup failures are reported (the console by default). */
export interface Logger {
  error(message: string): void;
}

export interface BackupOptions {
  dir: string;
  /** How many copies to keep. */
  keep?: number;
  /** Minimum time between two backups on the write path. */
  intervalMs?: number;
  now?: () => number;
}

export interface Backups {
  backupNow(source: string, schemaVersion: number): Promise<string>;
  backupQuietly(source: string, schemaVersion: number, log?: Logger): Promise<string | null>;
  backupIfDue(source: string, schemaVersion: number, log?: Logger): Promise<string | null>;
  list(): Promise<string[]>;
  newest(): Promise<string | null>;
}

// Rolling copies of db.json in <dir>. Names are `db-<UTC timestamp>-v<schemaVersion>.json`, so a
// plain name sort is chronological and the file says which schema it holds.
export function createBackups({
  dir,
  keep = 10,
  intervalMs = 10 * 60 * 1000,
  now = Date.now,
}: BackupOptions): Backups {
  let lastStamp = 0;
  let lastBackupAt = now();

  // Strictly increasing, so two backups in the same millisecond never share a name.
  const stamp = () => {
    lastStamp = Math.max(now(), lastStamp + 1);
    return new Date(lastStamp).toISOString().replace(/[-:.]/g, '');
  };

  const list = async (): Promise<string[]> => {
    try {
      return (await fs.readdir(dir)).filter((name) => NAME.test(name)).sort();
    } catch (err) {
      if (errorCode(err) === 'ENOENT') return [];
      throw err;
    }
  };

  const prune = async () => {
    const names = await list();
    for (const name of names.slice(0, Math.max(0, names.length - keep))) {
      await fs.rm(path.join(dir, name), { force: true });
    }
  };

  // Copies `source` now. Throws on failure: a migration must not run without its safety copy.
  async function backupNow(source: string, schemaVersion: number): Promise<string> {
    await fs.mkdir(dir, { recursive: true });
    const target = path.join(dir, `db-${stamp()}-v${schemaVersion}.json`);
    await fs.copyFile(source, target);
    lastBackupAt = now();
    await prune();
    return target;
  }

  return {
    backupNow,
    // Failure is logged and swallowed: a missing backup must never fail a request.
    async backupQuietly(source, schemaVersion, log = console) {
      try {
        return await backupNow(source, schemaVersion);
      } catch (err) {
        log.error(`Backup failed: ${errorMessage(err)}`);
        return null;
      }
    },
    // At most one backup per interval, for use on the write path.
    async backupIfDue(source, schemaVersion, log = console) {
      if (now() - lastBackupAt < intervalMs) return null;
      // Claim the slot first so a slow copy does not trigger a second one.
      lastBackupAt = now();
      try {
        return await backupNow(source, schemaVersion);
      } catch (err) {
        log.error(`Backup failed: ${errorMessage(err)}`);
        return null;
      }
    },
    list,
    async newest() {
      const names = await list();
      const last = names.at(-1);
      return last === undefined ? null : path.join(dir, last);
    },
  };
}
