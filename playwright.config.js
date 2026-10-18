const { defineConfig, devices } = require('@playwright/test');

// Only behaviour smoke tests remain (the screenshot/visual suite was removed). smoke.spec.js runs
// against the Vite dev server on :3000; prod-smoke.spec.js runs against the built client Express
// serves on :5001.
const prodSmoke = '**/prod-smoke.spec.js';

module.exports = defineConfig({
  testDir: 'e2e',
  outputDir: 'e2e/test-results',
  globalSetup: require.resolve('./e2e/global-setup.js'),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 60000,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    ...devices['Desktop Chrome'],
    deviceScaleFactor: 1,
    locale: 'en-GB',
    timezoneId: 'UTC',
  },
  projects: [
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
      // Vite dev server on the fixed port 3000 (strictPort in client/vite.config.ts).
      command: 'npm run dev -w client',
      // The query devtools button would sit on top of the page.
      env: { VITE_QUERY_DEVTOOLS: 'false' },
      url: 'http://localhost:3000',
      reuseExistingServer: false,
      timeout: 300000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
