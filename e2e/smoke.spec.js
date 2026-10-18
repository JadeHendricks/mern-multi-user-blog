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
    await expect(page.getByRole('link', { name: title })).toBeVisible();
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

  await page.getByRole('link', { name: 'Log out' }).click();
  await page.waitForURL('**/login');
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Log out' })).toHaveCount(0);
});

// KNOWN BUG B15: PrivateRoute shows the loader for anyone who is not authenticated. Today an
// anonymous visitor on /create-post is sent to /login by AuthState (the URL is not on its public
// list), so the loader is only seen on the way. This test pins what really happens; Phase 1 will
// change it on purpose.
test('KNOWN BUG B15: logged-out /create-post behaviour', async ({ page }) => {
  await page.goto(routes.createPost);
  await page.waitForLoadState('networkidle');
  const behaviour = {
    path: new URL(page.url()).pathname,
    createPostFormShown: (await page.getByRole('heading', { name: /create/i }).count()) > 0,
    loginFormShown:
      (await page.getByRole('heading', { name: 'Log into your account' }).count()) > 0,
  };
  test.info().annotations.push({ type: 'b15-observed', description: JSON.stringify(behaviour) });
  expect(behaviour).toEqual({
    path: '/login',
    createPostFormShown: false,
    loginFormShown: true,
  });
});
