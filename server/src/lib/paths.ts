import fs from 'node:fs';
import path from 'node:path';

// Where the server's folders are. The code runs from two layouts:
//   server/src/lib/paths.ts            (tsx, vitest)
//   server/dist/src/lib/paths.js       (the compiled build)
// A path like '../data' written relative to this file would be right in one and wrong in the other,
// so the server package is found by walking up to its package.json and everything is built from there.

const SERVER_PACKAGE_NAME = '@mern-blog/server';

function isServerManifest(file: string): boolean {
  try {
    const manifest: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
    return (
      typeof manifest === 'object' &&
      manifest !== null &&
      'name' in manifest &&
      manifest.name === SERVER_PACKAGE_NAME
    );
  } catch {
    // No package.json here (or not readable / not JSON): keep walking up.
    return false;
  }
}

/**
 * The folder of the nearest package.json named `@mern-blog/server`, searching `fromDir` and then its
 * parents. Other package.json files on the way (for example one inside dist) are skipped.
 */
export function findServerRoot(fromDir: string): string {
  let dir = path.resolve(fromDir);
  for (;;) {
    if (isServerManifest(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(`Could not find the ${SERVER_PACKAGE_NAME} package above ${fromDir}.`);
    }
    dir = parent;
  }
}

export const SERVER_ROOT = findServerRoot(import.meta.dirname);
/** Where the data lives unless DATA_DIR says otherwise (git-ignored). */
export const DEFAULT_DATA_DIR = path.join(SERVER_ROOT, 'data');
/** Sample images the seed script copies into the uploads folders. */
export const SEED_ASSETS_DIR = path.join(SERVER_ROOT, 'seed-assets');
/** The built client, served by the API in production. */
export const CLIENT_BUILD_DIR = path.resolve(SERVER_ROOT, '..', 'client', 'build');
