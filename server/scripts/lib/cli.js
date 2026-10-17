import { parseArgs } from 'node:util';
import { ConfigError, loadConfig } from '../../src/config.js';
import { isLocalMongoUri } from '../../src/lib/mongo-uri.js';
import { createStore } from '../../src/store/index.js';

// Shared by seed, db:export and db:import. Nothing here prints a Mongo URI: it may hold credentials.

export const REMOTE_HINT = 'Pass --allow-remote only if you really mean to touch a database that is not on this machine.';

export function readArgs(argv, extra = {}) {
  return parseArgs({
    args: argv,
    allowPositionals: true,
    options: { driver: { type: 'string' }, ...extra },
  });
}

// The scripts never sign a token, but the shared config schema wants a JWT secret. A real one
// from the environment wins; otherwise this placeholder keeps validation happy.
const PLACEHOLDER_SECRET = 'script-run-never-signs-a-token-0000';

export function scriptConfig(env, driver) {
  const merged = { JWT_SECRET: PLACEHOLDER_SECRET, ...env };
  if (driver) merged.DB_DRIVER = driver;
  return loadConfig(merged);
}

// Opens the configured store. The JSON store refuses to start while a running server holds its
// folder lock, which is what stops a script from clobbering a live dev server.
export async function openStore(config) {
  const store = await createStore(config);
  await store.init();
  return store;
}

// Config problems and store problems are printed as a message (key names only) and exit code 1.
export function describeError(err) {
  const text = err instanceof ConfigError ? err.message : `${err.name === 'Error' ? '' : `${err.name}: `}${err.message}`;
  // A driver error can quote the connection string; never let it reach the terminal.
  return text.replace(/mongodb(\+srv)?:\/\/\S+/gi, '<mongo uri hidden>');
}

export const isLocalTarget = (config) => config.DB_DRIVER !== 'mongo' || isLocalMongoUri(config.MONGO_URI);
