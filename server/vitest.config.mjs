import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/api/**/*.test.js', 'test/store/**/*.test.js', 'test/unit/**/*.test.js'],
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
