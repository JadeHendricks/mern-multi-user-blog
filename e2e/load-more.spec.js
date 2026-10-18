// "Load more" cursor pagination on the home feed and the users page.
// The seed has 6 posts and 4 users, below the page size of 12, so the button never shows in the
// other specs. The two screenshots here use the real API answer with a nextCursor added by
// page.route (deterministic, nothing is written). The last test uses the real server: it creates
// 8 posts, pages through them and deletes them again, so later specs see the original 6.
const { request } = require('@playwright/test');
const { test, expect, visit, routes, storageState } = require('./fixtures');

// Lets the real answer through and only adds a nextCursor, so the cards are the seeded ones.
async function withNextCursor(page, urlPattern) {
  await page.route(urlPattern, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ response, json: { ...body, nextCursor: 'fixture-cursor' } });
  });
}

test.describe('Load more (route fixtures)', () => {
  test('home shows the button under the cards', async ({ page }) => {
    await withNextCursor(page, '**/api/post?limit=12');
    await visit(page, routes.home);
    await expect(page.getByRole('button', { name: 'Load more' })).toBeVisible();
    await expect(page).toHaveScreenshot('home-load-more.png', { fullPage: true });
  });

  test('users shows the button under the cards', async ({ page }) => {
    await withNextCursor(page, '**/api/user?limit=12');
    await visit(page, routes.users);
    await expect(page.getByRole('button', { name: 'Load more' })).toBeVisible();
    await expect(page).toHaveScreenshot('users-load-more.png', { fullPage: true });
  });

  test('the button is hidden when the server has no next page', async ({ page }) => {
    await visit(page, routes.home);
    await expect(page.locator('.card')).toHaveCount(6);
    await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0);
    await visit(page, routes.users);
    await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0);
  });
});

test.describe('Load more (real server)', () => {
  const created = [];
  let api;

  test.beforeAll(async () => {
    // Cookies are scoped to the host, so the owner's saved login also works on port 5000.
    api = await request.newContext({ baseURL: 'http://localhost:5000', storageState: storageState.owner });
  });

  // Deletes what the test made, even when it failed half way.
  test.afterAll(async () => {
    for (const id of created) await api.delete(`/api/post/${id}`);
    await api.dispose();
  });

  test('pages through 14 posts: 12, then 14, then no button', async ({ page }, testInfo) => {
    // One run is enough and it keeps the three viewport projects from writing the same data.
    test.skip(testInfo.project.name !== 'desktop', 'desktop only');
    for (let n = 1; n <= 8; n++) {
      const res = await api.post('/api/post', {
        multipart: { title: `Load more post ${n}`, tag: 'general', description: `Created by the load more spec, number ${n}. The server asks for at least 50 characters.` },
      });
      expect(res.status()).toBe(201);
      created.push((await res.json()).post._id);
    }

    await visit(page, routes.home);
    await expect(page.locator('.card')).toHaveCount(12);
    const button = page.getByRole('button', { name: 'Load more' });
    await expect(button).toBeVisible();

    await button.click();
    await expect(page.locator('.card')).toHaveCount(14);
    await expect(button).toHaveCount(0);
  });
});
