const { defineConfig, devices } = require('@playwright/test');

const desktopOnly = ['**/smoke.spec.js', '**/a11y.spec.js'];

// The client has to be served on exactly http://localhost:3000: AuthState.js hard-codes that origin
// in its public-route allow-list (B14), and the CRA proxy forwards /api to the API on port 5000.
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
      testIgnore: desktopOnly,
    },
    {
      name: 'tablet',
      use: { viewport: { width: 768, height: 1024 } },
      testIgnore: desktopOnly,
    },
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 800 } },
    },
  ],
  // Playwright starts these before globalSetup. The API launcher seeds a JSON-file store in a temp folder.
  webServer: [
    {
      command: 'node e2e/support/start-api.js',
      url: 'http://localhost:5000/api/post',
      reuseExistingServer: false,
      timeout: 300000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run start -w client',
      url: 'http://localhost:3000',
      reuseExistingServer: false,
      timeout: 300000,
      // SKIP_PREFLIGHT_CHECK: CRA 3.4 aborts because the root eslint 10 sits above client/ in the
      // dependency tree. The client has its own eslint 6; the check does not apply to this layout.
      env: { BROWSER: 'none', PORT: '3000', SKIP_PREFLIGHT_CHECK: 'true' },
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
