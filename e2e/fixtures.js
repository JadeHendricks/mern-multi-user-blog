// Shared Playwright fixtures: a frozen clock, no external network, and a "settle" helper that
// waits until the page has stopped changing, so screenshots are identical from run to run.
const base = require('@playwright/test');
const { ids, routes, owner, visitor, storageState } = require('./support/seed-data');

const FIXED_TIME = new Date('2026-01-15T10:00:00Z');
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

const test = base.test.extend({
  page: async ({ page }, use) => {
    // Date.now() and new Date() stay fixed; timers keep running, so React and toasts still work.
    await page.clock.setFixedTime(FIXED_TIME);
    // The only external request in the app is the Google Fonts <link> in index.html. Abort it (and
    // anything else that is not local) so the fallback font is the same on every machine and run.
    await page.route(
      (url) => !LOCAL_HOSTS.has(url.hostname) && /^https?:$/.test(url.protocol),
      (route) => route.abort(),
    );
    await use(page);
  },
});

// Waits for: no pending requests, the app loader gone, every image decoded, fonts ready.
async function settle(page) {
  await page.waitForLoadState('networkidle');
  await base.expect(page.locator('.loader')).toHaveCount(0);
  await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete));
  await page.evaluate(() => document.fonts.ready);
}

async function visit(page, route) {
  await page.goto(route);
  await settle(page);
}

// The forgot-password page is public, but AuthState only allow-lists some URLs (B14) and sends an
// anonymous visitor who loads /forgot-password directly to /login. Going through the link on the
// login page is a client-side navigation, so the real page renders.
async function visitForgotPassword(page) {
  await visit(page, routes.login);
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await page.waitForURL('**' + routes.forgot);
  await settle(page);
}

// Screenshot of one element plus a few pixels around it, so hover and focus rings are included.
async function expectElementShot(page, locator, name, pad = 8) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  const clip = {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  };
  await base.expect(page).toHaveScreenshot(name, { clip });
}

module.exports = {
  test,
  expect: base.expect,
  settle,
  visit,
  visitForgotPassword,
  expectElementShot,
  ids,
  routes,
  owner,
  visitor,
  storageState,
};
