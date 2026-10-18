// Production-build smoke test (no screenshots). Runs only in the prod-smoke project: Express serves
// the bundle built into client/dist on port 5001, with no Vite dev server involved.
const { test, expect, visit, routes, owner } = require('./fixtures');

// Collects the URLs of the scripts the page loads, so we can prove the built bundle is what runs.
function trackScripts(page) {
  const scripts = [];
  page.on('response', (response) => {
    if (response.request().resourceType() === 'script')
      scripts.push(new URL(response.url()).pathname);
  });
  return scripts;
}

test('home lists the seeded posts from the built bundle', async ({ page }) => {
  const scripts = trackScripts(page);
  await visit(page, routes.home);
  await expect(page.locator('.card')).toHaveCount(6);
  // Vite emits hashed files under /assets; the dev server would serve /src/*.jsx instead.
  expect(scripts.some((src) => /^\/assets\/.+\.js$/.test(src))).toBe(true);
  expect(scripts.some((src) => src.startsWith('/src/') || src.startsWith('/@vite'))).toBe(false);
});

test('a post page renders and a deep link falls back to index.html', async ({ page }) => {
  await visit(page, routes.post);
  await expect(page.getByRole('heading', { name: 'Three days in Lisbon' }).first()).toBeVisible();
});

test('login through the UI', async ({ page }) => {
  await visit(page, routes.login);
  await page.getByLabel('Email address').fill(owner.email);
  await page.getByLabel('Password').fill(owner.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'Create Post' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Log in' })).toHaveCount(0);
});

test('Load more appends the next page (route fixture)', async ({ page }) => {
  // Lets the real first page through and adds a cursor; the second page is the same list again.
  await page.route('**/api/post?limit=12', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ response, json: { ...body, nextCursor: 'fixture-cursor' } });
  });
  await page.route('**/api/post?limit=12&cursor=*', async (route) => {
    const response = await route.fetch({
      url: new URL('/api/post?limit=12', route.request().url()).href,
    });
    const body = await response.json();
    await route.fulfill({
      response,
      json: { ...body, posts: body.posts.slice(0, 2), nextCursor: null },
    });
  });
  await visit(page, routes.home);
  await expect(page.locator('.card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Load more' }).click();
  await expect(page.locator('.card')).toHaveCount(8);
  await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0);
});
