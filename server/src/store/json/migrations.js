import { StoreError } from '../errors.js';

// Ordered steps that bring an older db.json up to date. Each step only changes the shape of the
// data and bumps the version; backing up first is the caller's job (file-db.js).
export const migrations = [
  {
    // Version 0 is a bare { users, posts } file from before the file carried a version.
    to: 1,
    up: (data) => ({ users: [], posts: [], ...data }),
  },
];

export const latestVersion = (steps = migrations) => steps[steps.length - 1].to;

export const versionOf = (data) => (Number.isInteger(data.schemaVersion) ? data.schemaVersion : 0);

export const needsMigration = (data, steps = migrations) => versionOf(data) < latestVersion(steps);

// Returns the data at the newest version. A file written by newer code is refused: downgrading
// silently could drop fields the older code does not know about.
export function migrate(data, steps = migrations) {
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
  return current;
}
