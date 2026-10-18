import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describeError, openStore, readArgs, scriptConfig } from './lib/cli.js';
import { FORMAT, FORMAT_VERSION } from './lib/export-file.js';

// npm run db:export [-- out.json] [--driver json|mongo]
//
// Writes every user and post of the configured store to one JSON file. Reading a remote Mongo is
// allowed (that is how you move data off a hosted cluster); db:import is the guarded direction.
// The file holds password hashes, so it is written under DATA_DIR (gitignored) by default.

const stamp = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

/**
 * @param {string[]} argv
 * @param {{env?: object, out?: Function, err?: Function, open?: Function, now?: () => Date}} [io]
 */
export async function run(argv, { env = process.env, out = console.log, err = console.error, open = openStore, now = () => new Date() } = {}) {
  let store;
  try {
    const { values, positionals } = readArgs(argv);
    const config = scriptConfig(env, values.driver);
    store = await open(config);
    const exportedAt = now();
    const data = await store.admin.exportAll();
    const file = path.resolve(positionals[0] ?? path.join(config.DATA_DIR, 'exports', `export-${stamp(exportedAt)}.json`));
    await mkdir(path.dirname(file), { recursive: true });
    const body = {
      format: FORMAT,
      version: FORMAT_VERSION,
      exportedAt: exportedAt.toISOString(),
      schemaVersion: data.schemaVersion,
      users: data.users,
      posts: data.posts,
    };
    // 'wx': never overwrite an earlier export by accident.
    await writeFile(file, `${JSON.stringify(body, null, 2)}\n`, { flag: 'wx' });
    out(`Exported ${data.users.length} users and ${data.posts.length} posts to ${file}`);
    out('Warning: this file contains password hashes. Keep it private and out of git.');
    return 0;
  } catch (error) {
    err(describeError(error));
    return 1;
  } finally {
    await store?.close().catch(() => {});
  }
}

if (import.meta.filename === process.argv[1]) {
  process.exitCode = await run(process.argv.slice(2));
}
