// Behaviour checks (no screenshots). Desktop project only.
const { test, expect, visit, routes, owner } = require('./fixtures');

const seededTitles = [
  'Three days in Lisbon',
  'Why my cat judges my code',
  'A small guide to sourdough',
  'Notes from a week offline',
  'Hiking the coastal path',
  'The unreasonable joy of a good keyboard',
];

test('home page lists the seeded posts', async ({ page }) => {
  await visit(page, routes.home);
  for (const title of seededTitles) {
    // exact: the card's image link is named after the post too (title plus tag), so a substring would match two links.
    await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
  }
});

test('login and logout through the UI', async ({ page }) => {
  await visit(page, routes.login);
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();

  await page.getByLabel('Email address').fill(owner.email);
  await page.getByLabel('Password').fill(owner.password);
  await page.getByRole('button', { name: 'Login' }).click();

  // Logged-in navigation: first name, Create Post and Log out.
  const header = page.locator('header');
  await expect(header.getByRole('link', { name: owner.name.split(' ')[0] })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Create Post' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Log in' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Log out' }).click();
  await page.waitForURL('**/login');
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log out' })).toHaveCount(0);
});

// B15/B14: PrivateRoute waits for the session check, then redirects; public pages are never redirected.
test('logged-out /create-post lands on /login', async ({ page }) => {
  await page.goto(routes.createPost);
  await page.waitForURL('**/login');
  await expect(page.getByRole('heading', { name: 'Log into your account' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /create/i })).toHaveCount(0);
});

for (const [name, route] of [
  ['home', routes.home],
  ['post', routes.post],
  ['users', routes.users],
]) {
  test(`logged-out visit to ${name} stays put`, async ({ page }) => {
    await visit(page, route);
    expect(new URL(page.url()).pathname).toBe(route);
  });
}

// B19: the profile page renders a user's social links, and only https ones.
test('profile page shows the three https social links', async ({ page }) => {
  await visit(page, routes.profileDan);
  const links = page.locator('.user-header__socials a');
  await expect(links).toHaveCount(3);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('href', /^https:\/\//);
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }
});
// Uploaded images and avatars are served from /uploads and actually decode in the browser.
test('seeded post images and avatars load from /uploads', async ({ page }) => {
  await visit(page, routes.home);
  for (const selector of ['.card__image', '.card__avatar']) {
    const images = page.locator(selector);
    expect(await images.count()).toBeGreaterThan(0);
    for (const image of await images.all()) {
      await expect(image).toHaveAttribute('src', /^\/uploads\/(posts|users)\//);
      expect(await image.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
    }
  }
});

test('a broken upload falls back to the bundled default image', async ({ page }) => {
  // Every upload answers 404, as if the files had been deleted.
  await page.route('**/uploads/**', (route) => route.fulfill({ status: 404, body: 'Not found' }));
  await page.goto(routes.home);
  const image = page.locator('.card__image').first();
  await expect(image).toHaveAttribute('src', /default.*\.jpg$/);
  await expect.poll(() => image.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.card__avatar').first()).toHaveAttribute('src', /default.*\.jpg$/);
});