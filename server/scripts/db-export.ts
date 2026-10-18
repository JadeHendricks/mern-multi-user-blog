import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describeError, openStore, readArgs, scriptConfig } from './lib/cli.js';
import type { ScriptIo } from './lib/cli.js';
import type { Store } from '../src/store/types.js';
import { FORMAT, FORMAT_VERSION } from './lib/export-file.js';

// npm run db:export [-- out.json] [--driver json|mongo]
//
// Writes every user and post of the configured store to one JSON file. Reading a remote Mongo is
// allowed (that is how you move data off a hosted cluster); db:import is the guarded direction.
// The file holds password hashes, so it is written under DATA_DIR (gitignored) by default.

const stamp = (date: Date): string =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z');

export async function run(
  argv: readonly string[],
  {
    env = process.env,
    out = console.log,
    err = console.error,
    open = openStore,
    now = () => new Date(),
  }: ScriptIo & { now?: () => Date } = {},
): Promise<number> {
  let store: Store | undefined;
  try {
    const { values, positionals } = readArgs(argv);
    const config = scriptConfig(env, values.driver);
    store = await open(config);
    const exportedAt = now();
    const data = await store.admin.exportAll();
    const file = path.resolve(
      positionals[0] ?? path.join(config.DATA_DIR, 'exports', `export-${stamp(exportedAt)}.json`),
    );
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
    await store?.close().catch(() => undefined);
  }
}

if (import.meta.filename === process.argv[1]) {
  process.exitCode = await run(process.argv.slice(2));
}
