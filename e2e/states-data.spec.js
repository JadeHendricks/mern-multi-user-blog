// Screenshot baselines for data-dependent states: empty lists, the loading overlay, the "Load more"
// button (enabled and disabled) and the logged-in header. Runs in all three projects.
// Read-only: the API answers are changed with page.route, nothing is written. Selectors use roles
// and text where they can, so the specs survive the stylesheet refactor.
const { test, expect, visit, expectElementShot, routes, storageState } = require('./fixtures');

// Lets the real answer through and replaces some of its fields.
async function patchResponse(page, urlPattern, patch) {
  await page.route(urlPattern, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ response, json: { ...body, ...patch } });
  });
}

test.describe('empty lists', () => {
  test('empty feed', async ({ page }) => {
    await patchResponse(page, '**/api/post?limit=12', { posts: [], nextCursor: null });
    await visit(page, routes.home);
    await expect(page.getByRole('heading', { name: 'No Content Found...' })).toBeVisible();
    await expect(page).toHaveScreenshot('home-empty.png', { fullPage: true });
  });

  test('empty users', async ({ page }) => {
    await patchResponse(page, '**/api/user?limit=12', { users: [], nextCursor: null });
    await visit(page, routes.users);
    await expect(page.getByRole('heading', { name: 'No Content Found...' })).toBeVisible();
    await expect(page).toHaveScreenshot('users-empty.png', { fullPage: true });
  });
});

test.describe('loading overlay', () => {
  test('feed while the posts request is pending', async ({ page }) => {
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    await page.route('**/api/post?limit=12', async (route) => {
      await gate;
      await route.continue();
    });
    // The auth check answers quickly; waiting for it leaves only the held posts request pending.
    const authAnswered = page.waitForResponse('**/api/user/me');
    await page.goto(routes.home);
    await authAnswered;
    await expect(page.locator('.loader-container')).toHaveCount(1);
    await expect(page).toHaveScreenshot('home-loading.png');
    release();
    await expect(page.locator('.loader-container')).toHaveCount(0);
  });
});

test.describe('load more button', () => {
  test('enabled', async ({ page }) => {
    await patchResponse(page, '**/api/post?limit=12', { nextCursor: 'fixture-cursor' });
    await visit(page, routes.home);
    const button = page.getByRole('button', { name: 'Load more' });
    await expect(button).toBeEnabled();
    await expectElementShot(page, button, 'load-more-enabled.png');
  });

  test('disabled while the next page loads', async ({ page }) => {
    await patchResponse(page, '**/api/post?limit=12', { nextCursor: 'fixture-cursor' });
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    // The second page request is held, so the button stays disabled for the screenshot.
    await page.route('**/api/post?limit=12&cursor=*', async (route) => {
      await gate;
      await route.abort();
    });
    await visit(page, routes.home);
    const button = page.getByRole('button', { name: 'Load more' });
    await button.click();
    await expect(button).toBeDisabled();
    await page.mouse.move(0, 0);
    await expectElementShot(page, button, 'load-more-disabled.png');
    release();
  });
});

test.describe('logged-in header', () => {
  test.use({ storageState: storageState.owner });

  test('header with the avatar and the Create Post button', async ({ page }) => {
    await visit(page, routes.home);
    await expectElementShot(page, page.getByRole('banner'), 'header-logged-in.png');
  });
});
