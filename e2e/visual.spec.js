// Screenshot baselines for every route. Runs in all three projects (375, 768 and 1280 px wide).
// Read-only: no spec submits a form that changes data.
const {
  test,
  expect,
  visit,
  visitForgotPassword,
  expectElementShot,
  routes,
  owner,
  storageState,
} = require('./fixtures');

const full = { fullPage: true };

test.describe('anonymous visitor', () => {
  const pages = [
    ['home', routes.home],
    ['post', routes.post],
    ['profile', routes.profileOwner],
    ['users', routes.users],
    ['most-popular-posts', routes.popular],
    ['login', routes.login],
    ['register', routes.register],
    ['reset-password', routes.reset],
    ['activate-account', routes.activate],
  ];

  for (const [name, route] of pages) {
    test(name, async ({ page }) => {
      await visit(page, route);
      await expect(page).toHaveScreenshot(`${name}.png`, full);
    });
  }

  test('forgot-password', async ({ page }) => {
    await visitForgotPassword(page);
    await expect(page).toHaveScreenshot('forgot-password.png', full);
  });

  test('toast after a failed login', async ({ page }) => {
    await visit(page, routes.login);
    await page.getByLabel('Email address').fill(owner.email);
    await page.getByLabel('Password').fill('not-the-password');
    // A rejected login only answers 401; nothing is written.
    await page.getByRole('button', { name: 'Login' }).click();
    const toast = page.locator('.Toastify__toast');
    await expect(toast).toContainText('Incorrect email or password');
    // react-toastify removes the bounce-enter class when the slide-in ends (about 750 ms).
    await expect(toast).not.toHaveClass(/bounce-enter/);
    // The toast closes when its progress-bar animation ends. A window blur pauses that animation,
    // and "animations: allow" stops Playwright from fast-forwarding it (which would close the
    // toast mid-screenshot). The bar is hidden for the shot because its width depends on timing.
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.addStyleTag({ content: '.Toastify__progress-bar { visibility: hidden; }' });
    await expect(toast).toHaveScreenshot('toast-login-failed.png', { animations: 'allow' });
  });
});

test.describe('hover and focus states', () => {
  test('login form', async ({ page }) => {
    await visit(page, routes.login);
    const submit = page.getByRole('button', { name: 'Login' });
    await submit.hover();
    await expectElementShot(page, submit, 'login-button-hover.png');
    await page.mouse.move(0, 0);
    await submit.focus();
    await expectElementShot(page, submit, 'login-button-focus.png');
    const email = page.getByLabel('Email address');
    await email.focus();
    await expectElementShot(page, email, 'login-input-focus.png');
  });

  test('home page', async ({ page }) => {
    await visit(page, routes.home);
    const card = page.locator('.card').first();
    await card.hover();
    await expectElementShot(page, card, 'home-card-hover.png');
    const cta = page.getByRole('link', { name: 'Register' });
    await cta.hover();
    await expectElementShot(page, cta, 'home-register-hover.png');
  });
});

test.describe('logged in as the owner', () => {
  test.use({ storageState: storageState.owner });

  const pages = [
    ['home-logged-in', routes.home],
    ['post-as-owner', routes.post],
    ['profile-as-owner', routes.profileOwner],
    ['create-post', routes.createPost],
    ['edit-post', routes.editPost],
    ['not-found', '/this-route-does-not-exist'],
  ];

  for (const [name, route] of pages) {
    test(name, async ({ page }) => {
      await visit(page, route);
      await expect(page).toHaveScreenshot(`${name}.png`, full);
    });
  }

  test('account settings', async ({ page }) => {
    await visit(page, routes.profileOwner);
    await page.getByRole('button', { name: 'Account settings' }).click();
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible();
    await expect(page).toHaveScreenshot('account-settings.png', full);
  });

  test('header hover state', async ({ page }) => {
    await visit(page, routes.home);
    const create = page.getByRole('link', { name: 'Create Post' });
    await create.hover();
    await expectElementShot(page, create, 'header-create-post-hover.png');
  });
});

test.describe('logged in as the visitor', () => {
  test.use({ storageState: storageState.visitor });

  const pages = [
    ['home-as-visitor', routes.home],
    ['post-as-visitor', routes.post],
    ['profile-of-other-user', routes.profileOwner],
  ];

  for (const [name, route] of pages) {
    test(name, async ({ page }) => {
      await visit(page, route);
      await expect(page).toHaveScreenshot(`${name}.png`, full);
    });
  }
});
