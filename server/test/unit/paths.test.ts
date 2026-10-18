import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  CLIENT_DIST_DIR,
  DEFAULT_DATA_DIR,
  SEED_ASSETS_DIR,
  SERVER_ROOT,
  findServerRoot,
} from '../../src/lib/paths.js';

// The same folders must come out whether the code runs from server/src (tsx, vitest) or from the
// compiled server/dist/src, so these tests build both layouts in a temp folder.
const root = mkdtempSync(path.join(tmpdir(), 'mern-blog-paths-'));
const server = path.join(root, 'server');
const fromSource = path.join(server, 'src', 'lib');
const fromDist = path.join(server, 'dist', 'src', 'lib');

mkdirSync(fromSource, { recursive: true });
mkdirSync(fromDist, { recursive: true });
writeFileSync(path.join(server, 'package.json'), JSON.stringify({ name: '@mern-blog/server' }));
// A package.json with another name (or none) on the way up must be skipped, like the one in dist.
writeFileSync(path.join(server, 'dist', 'package.json'), JSON.stringify({ type: 'module' }));
writeFileSync(path.join(server, 'dist', 'src', 'package.json'), JSON.stringify({ name: 'other' }));
writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'mern-multi-user-blog' }));

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('findServerRoot', () => {
  it('finds the server folder from the source layout', () => {
    expect(findServerRoot(fromSource)).toBe(server);
  });

  it('finds the same folder from the compiled layout, skipping other package.json files', () => {
    expect(findServerRoot(fromDist)).toBe(server);
  });

  it('accepts the server folder itself', () => {
    expect(findServerRoot(server)).toBe(server);
  });

  it('throws when no server package is above the folder', () => {
    expect(() => findServerRoot(path.join(root, 'elsewhere'))).toThrow(/@mern-blog\/server/);
  });
});

describe('the exported folders', () => {
  it('are the ones the server has always used', () => {
    // This file is server/test/unit/paths.test.ts, so the server folder is two levels up.
    const expectedRoot = path.resolve(import.meta.dirname, '../..');

    expect(SERVER_ROOT).toBe(expectedRoot);
    expect(DEFAULT_DATA_DIR).toBe(path.join(expectedRoot, 'data'));
    expect(SEED_ASSETS_DIR).toBe(path.join(expectedRoot, 'seed-assets'));
    expect(CLIENT_DIST_DIR).toBe(path.resolve(expectedRoot, '../client/dist'));
  });
});
