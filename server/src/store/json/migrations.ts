import { StoreError } from '../errors.js';
import type { JsonState } from './records.js';

/**
 * The data as found in a file or an import. The version may be missing in files that predate it,
 * and a step may be handed data without the lists (the first step fills them in).
 */
export interface SchemaData {
  schemaVersion?: number | undefined;
  users?: JsonState['users'] | undefined;
  posts?: JsonState['posts'] | undefined;
}

export interface Migration {
  /** The schema version this step produces. */
  to: number;
  up: (data: SchemaData) => SchemaData;
}

// Ordered steps that bring an older db.json up to date. Each step only changes the shape of the
// data and bumps the version; backing up first is the caller's job (file-db.ts).
export const migrations: readonly Migration[] = [
  {
    // Version 0 is a bare { users, posts } file from before the file carried a version.
    to: 1,
    up: (data) => ({ users: [], posts: [], ...data }),
  },
];

// Only the top level is checked: the two lists must exist. What is inside them is trusted from
// here on (a file or import that passed this is handled like any other), as it was before types.
export function looksLikeDatabase(data: unknown): data is SchemaData {
  return (
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data) &&
    'users' in data &&
    'posts' in data &&
    Array.isArray(data.users) &&
    Array.isArray(data.posts)
  );
}

export const latestVersion = (steps: readonly Migration[] = migrations): number =>
  steps.at(-1)?.to ?? 0;

export const versionOf = (data: { schemaVersion?: number | undefined }): number => {
  const { schemaVersion } = data;
  return typeof schemaVersion === 'number' && Number.isInteger(schemaVersion) ? schemaVersion : 0;
};

export const needsMigration = (
  data: { schemaVersion?: number | undefined },
  steps: readonly Migration[] = migrations,
): boolean => versionOf(data) < latestVersion(steps);

// Returns the data at the newest version. A file written by newer code is refused: downgrading
// silently could drop fields the older code does not know about.
export function migrate(data: SchemaData, steps: readonly Migration[] = migrations): JsonState {
  const latest = latestVersion(steps);
  let version = versionOf(data);
  if (version > latest) {
    throw new StoreError(
      `db.json has schemaVersion ${version} but this server only understands up to ${latest}. Update the server or restore an older backup.`,
    );
  }
  let current = data;
  for (const step of steps) {
    if (step.to <= version) continue;
    current = { ...step.up(current), schemaVersion: step.to };
    version = step.to;
  }
  return {
    ...current,
    users: current.users ?? [],
    posts: current.posts ?? [],
    schemaVersion: version,
  };
}
