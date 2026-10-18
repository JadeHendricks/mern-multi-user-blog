import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  describeError,
  isLocalTarget,
  openStore,
  readArgs,
  REMOTE_HINT,
  scriptConfig,
} from './lib/cli.js';
import type { ScriptIo } from './lib/cli.js';
import { describeProblems, exportFileSchema, FORMAT } from './lib/export-file.js';
import { errorCode } from '../src/lib/errors.js';
import type { Store } from '../src/store/types.js';

// npm run db:import -- file.json [--replace] [--allow-remote] [--driver json|mongo]
//
// Loads a db:export file into the configured store. It works json -> mongo, mongo -> json and
// back into the same driver. The target must be empty unless --replace is given (the JSON store
// keeps a backup of its file from startup). A Mongo server that is not on this machine, including
// every mongodb+srv:// address, is refused unless --allow-remote is given.

export async function run(
  argv: readonly string[],
  { env = process.env, out = console.log, err = console.error, open = openStore }: ScriptIo = {},
): Promise<number> {
  let store: Store | undefined;
  try {
    const { values, positionals } = readArgs(argv, ['replace', 'allow-remote']);
    const [importPath] = positionals;
    if (positionals.length !== 1 || importPath === undefined) {
      err(
        'Usage: npm run db:import -- <file.json> [--replace] [--allow-remote] [--driver json|mongo]',
      );
      return 1;
    }
    const config = scriptConfig(env, values.driver);

    // Checked before the file is read or any connection is opened.
    if (!isLocalTarget(config) && !values['allow-remote']) {
      err('Refusing to import: the Mongo server is not on this machine.');
      err(REMOTE_HINT);
      return 1;
    }

    let json: unknown;
    try {
      json = JSON.parse(await readFile(path.resolve(importPath), 'utf8'));
    } catch (error) {
      err(
        errorCode(error) === 'ENOENT' ? 'Import file not found.' : 'Import file is not valid JSON.',
      );
      return 1;
    }
    const parsed = exportFileSchema.safeParse(json);
    if (!parsed.success) {
      err(`Import file is not a valid ${FORMAT} file:\n${describeProblems(parsed.error)}`);
      return 1;
    }

    store = await open(config);
    const { schemaVersion, users, posts } = parsed.data;
    const data = { ...(schemaVersion !== undefined && { schemaVersion }), users, posts };
    const counts = await store.admin.importAll(data, { replace: values.replace });
    out(
      `Imported ${counts.users} users and ${counts.posts} posts into the ${config.DB_DRIVER} store.`,
    );
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
