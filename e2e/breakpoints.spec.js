// Full-page baselines at widths between the stylesheet breakpoints (1400, 1200, 991, 767, 590, 580, 500),
// which the 375, 768 and 1280 px projects never reach. Desktop project only; the width is set per test.
// Read-only: nothing is submitted.
const { test, expect, visit, routes, storageState } = require('./fixtures');

const widths = [1401, 1300, 1100, 900, 700, 585, 540, 450];
const anonymousPages = [
  ['users', routes.users],
  ['login', routes.login],
];
const ownerPages = [
  ['home', routes.home],
  ['post', routes.post],
  ['profile', routes.profileOwner],
  ['create-post', routes.createPost],
];

test.beforeEach((_fixtures, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop only');
});

for (const width of widths) {
  test.describe(`${width}px`, () => {
    test.describe('anonymous', () => {
      for (const [name, route] of anonymousPages) {
        test(name, async ({ page }) => {
          await page.setViewportSize({ width, height: 800 });
          await visit(page, route);
          await expect(page).toHaveScreenshot(`${name}-${width}.png`, { fullPage: true });
        });
      }
    });

    test.describe('owner', () => {
      test.use({ storageState: storageState.owner });
      for (const [name, route] of ownerPages) {
        test(name, async ({ page }) => {
          await page.setViewportSize({ width, height: 800 });
          await visit(page, route);
          await expect(page).toHaveScreenshot(`${name}-${width}.png`, { fullPage: true });
        });
      }
    });
  });
}
