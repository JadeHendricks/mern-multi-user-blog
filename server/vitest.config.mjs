import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Tests run against the shared package's source, never against a stale shared/dist build.
    alias: {
      '@mern-blog/shared': fileURLToPath(new URL('../shared/src/index.ts', import.meta.url)),
    },
  },
  test: {
    // .ts is new (FEAT-003); the older tests are still .js until they are converted.
    include: ['test/{api,store,unit}/**/*.test.{js,ts}'],
    // One forked process per test file: each file gets a fresh `config`, mongoose and app instance.
    pool: 'forks',
    fileParallelism: false,
    globalSetup: ['test/api/support/global-setup.js'],
    setupFiles: ['test/api/support/env.js'],
    // The first run downloads a MongoDB binary, so the hooks need a long timeout.
    hookTimeout: 600000,
    testTimeout: 30000,
  },
});
