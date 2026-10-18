// Copies the files tsc does not emit into dist. Today that is one file: scripts/seed-data.cjs.
// It stays CommonJS because the Playwright launcher must require() it; seed.ts imports it, so
// dist/scripts/seed.js needs it next to it. (seed-data.d.cts only types it for the compiler.)
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = import.meta.dirname;
const assets = [join('scripts', 'seed-data.cjs')];

for (const file of assets) {
  const target = join(root, 'dist', file);
  mkdirSync(join(target, '..'), { recursive: true });
  copyFileSync(join(root, file), target);
}
