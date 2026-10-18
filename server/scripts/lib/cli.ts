import { parseArgs } from 'node:util';
import { ConfigError, loadConfig } from '../../src/config.js';
import type { Config } from '../../src/config.js';
import { isLocalMongoUri } from '../../src/lib/mongo-uri.js';
import { createStore } from '../../src/store/index.js';
import type { Store } from '../../src/store/types.js';

// Shared by seed, db:export and db:import. Nothing here prints a Mongo URI: it may hold credentials.

export const REMOTE_HINT =
  'Pass --allow-remote only if you really mean to touch a database that is not on this machine.';

/** The environment a script reads (process.env, or a plain object in tests). */
export type ScriptEnv = Readonly<Record<string, string | undefined>>;

/** Opens the store a script works on. Tests pass their own to avoid a real connection. */
export type OpenStore = (config: Config) => Promise<Store>;

/** What every script's `run` takes besides its arguments; each field defaults to the real thing. */
export interface ScriptIo {
  env?: ScriptEnv;
  out?: (line: string) => void;
  err?: (line: string) => void;
  open?: OpenStore;
}

// `flags` adds boolean options on top of --driver. Anything else is an error, which is why
// db:export (no flags) rejects --reset while seed accepts it. Every flag asked for is present in
// `values`, true only when it was given.
export function readArgs<const Flag extends string = never>(
  argv: readonly string[],
  flags: readonly Flag[] = [],
): { values: { driver: string | undefined } & Record<Flag, boolean>; positionals: string[] } {
  const { values, positionals } = parseArgs({
    args: [...argv],
    allowPositionals: true,
    options: {
      driver: { type: 'string' },
      ...Object.fromEntries(flags.map((flag) => [flag, { type: 'boolean' as const }])),
    },
  });
  // Filled for exactly the flags asked for, which is what the Record type promises.
  const given = {} as Record<Flag, boolean>;
  const parsed: Record<string, unknown> = values;
  for (const flag of flags) given[flag] = parsed[flag] === true;
  return {
    values: { driver: typeof values.driver === 'string' ? values.driver : undefined, ...given },
    positionals,
  };
}
// The scripts never sign a token, but the shared config schema wants a JWT secret. A real one
// from the environment wins; otherwise this placeholder keeps validation happy.
const PLACEHOLDER_SECRET = 'script-run-never-signs-a-token-0000';

export function scriptConfig(env: ScriptEnv, driver: string | undefined): Config {
  const merged: Record<string, string | undefined> = { JWT_SECRET: PLACEHOLDER_SECRET, ...env };
  if (driver) merged.DB_DRIVER = driver;
  return loadConfig(merged);
}

// Opens the configured store. The JSON store refuses to start while a running server holds its
// folder lock, which is what stops a script from clobbering a live dev server.
export const openStore: OpenStore = async (config) => {
  const store = await createStore(config);
  await store.init();
  return store;
};

// Config problems and store problems are printed as a message (key names only) and exit code 1.
export function describeError(err: unknown): string {
  let text: string;
  if (err instanceof ConfigError) text = err.message;
  else if (err instanceof Error)
    text = `${err.name === 'Error' ? '' : `${err.name}: `}${err.message}`;
  else text = String(err);
  // A driver error can quote the connection string; never let it reach the terminal.
  return text.replace(/mongodb(\+srv)?:\/\/\S+/gi, '<mongo uri hidden>');
}

export const isLocalTarget = (config: Pick<Config, 'DB_DRIVER' | 'MONGO_URI'>): boolean =>
  config.DB_DRIVER !== 'mongo' || isLocalMongoUri(config.MONGO_URI);
