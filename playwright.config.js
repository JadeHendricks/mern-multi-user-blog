const { defineConfig, devices } = require('@playwright/test');

const desktopOnly = ['**/smoke.spec.js', '**/a11y.spec.js'];
// Runs only in the prod-smoke project, against the built client served by Express on port 5001.
const prodSmoke = '**/prod-smoke.spec.js';

// The client has to be served on exactly http://localhost:3000: AuthState.js hard-codes that origin
// in its public-route allow-list (B14), and the Vite dev proxy (client/vite.config.mjs) forwards
// /api and /uploads to the API on port 5000.
module.exports = defineConfig({
  testDir: 'e2e',
  outputDir: 'e2e/test-results',
  // Baselines have no platform suffix. They were rendered with Chromium on Windows and must be
  // regenerated when CI runs on Linux (see e2e/README.md).
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
  globalSetup: require.resolve('./e2e/global-setup.js'),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 60000,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixels: 0,
    },
  },
  use: {
    baseURL: 'http://localhost:3000',
    ...devices['Desktop Chrome'],
    deviceScaleFactor: 1,
    locale: 'en-GB',
    timezoneId: 'UTC',
  },
  projects: [
    {
      name: 'mobile',
      use: { viewport: { width: 375, height: 812 } },
      testIgnore: [...desktopOnly, prodSmoke],
    },
    {
      name: 'tablet',
      use: { viewport: { width: 768, height: 1024 } },
      testIgnore: [...desktopOnly, prodSmoke],
    },
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 800 } },
      testIgnore: [prodSmoke],
    },
    {
      name: 'prod-smoke',
      testMatch: prodSmoke,
      use: { baseURL: 'http://localhost:5001', viewport: { width: 1280, height: 800 } },
    },
  ],
  // Playwright starts these before globalSetup. The API launcher seeds a JSON-file store in a temp folder.
  webServer: [
    {
      // Runs the compiled server (server/dist). 'npm run test:e2e' builds it first (pretest:e2e).
      command: 'node e2e/support/start-api.js',
      url: 'http://localhost:5000/api/post',
      reuseExistingServer: false,
      timeout: 300000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      // Second API instance (own seeded temp store) that serves client/dist, for the prod-smoke project.
      command: 'node e2e/support/start-api.js',
      env: { E2E_SERVE_CLIENT: '1', E2E_PORT: '5001' },
      url: 'http://localhost:5001/api/post',
      reuseExistingServer: false,
      timeout: 300000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      // Vite dev server on the fixed port 3000 (strictPort in client/vite.config.mjs).
      command: 'npm run dev -w client',
      // The query devtools button would sit on top of every screenshot.
      env: { VITE_QUERY_DEVTOOLS: 'false' },
      url: 'http://localhost:3000',
      reuseExistingServer: false,
      timeout: 300000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
