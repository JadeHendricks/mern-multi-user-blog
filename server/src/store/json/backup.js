import fs from 'node:fs/promises';
import path from 'node:path';

const NAME = /^db-.*\.json$/;

// Rolling copies of db.json in <dir>. Names are `db-<UTC timestamp>-v<schemaVersion>.json`, so a
// plain name sort is chronological and the file says which schema it holds.
export function createBackups({ dir, keep = 10, intervalMs = 10 * 60 * 1000, now = Date.now }) {
  let lastStamp = 0;
  let lastBackupAt = now();

  // Strictly increasing, so two backups in the same millisecond never share a name.
  const stamp = () => {
    lastStamp = Math.max(now(), lastStamp + 1);
    return new Date(lastStamp).toISOString().replace(/[-:.]/g, '');
  };

  const list = async () => {
    try {
      return (await fs.readdir(dir)).filter((name) => NAME.test(name)).sort();
    } catch (err) {
      if (err.code === 'ENOENT') return [];
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
  async function backupNow(source, schemaVersion) {
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
        log.error(`Backup failed: ${err.message}`);
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
        log.error(`Backup failed: ${err.message}`);
        return null;
      }
    },
    list,
    async newest() {
      const names = await list();
      return names.length ? path.join(dir, names[names.length - 1]) : null;
    },
  };
}
