// Screenshot baselines for interaction states that visual.spec.js does not cover: radio buttons
// (unchecked, checked, focused), textarea focus and a few hover states. Runs in all three projects.
// Read-only: nothing is submitted or deleted. Selectors use roles, labels and text (not class names)
// so the specs keep working while the stylesheet is refactored.
const { test, expect, visit, expectElementShot, routes, ids, storageState } = require('./fixtures');

test.describe('radio buttons (edit post)', () => {
  test.use({ storageState: storageState.owner });

  // The radio group is the form group that holds the "Post Tag" label.
  const radioGroup = (page) => page.getByText('Post Tag', { exact: true }).locator('xpath=..');

  test('unchecked and checked', async ({ page }) => {
    await visit(page, routes.editPost);
    const group = radioGroup(page);
    await expectElementShot(page, group, 'radio-group-default.png');
    // CreatePost renders general as always checked (a React quirk), so this uses the edit form.
    // The input is visually hidden, so a click on its label is what a visitor does.
    await group.getByText('funny', { exact: true }).click();
    await expect(page.getByRole('radio', { name: 'funny' })).toBeChecked();
    await page.mouse.move(0, 0);
    await expectElementShot(page, group, 'radio-group-funny-checked.png');
  });

  test('keyboard focus', async ({ page }) => {
    await visit(page, routes.editPost);
    const group = radioGroup(page);
    await page.getByRole('radio', { name: 'general' }).focus();
    await expectElementShot(page, group, 'radio-group-general-focus.png');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('radio', { name: 'travel' })).toBeFocused();
    await expectElementShot(page, group, 'radio-group-travel-focus.png');
  });
});

test.describe('focus and hover', () => {
  test('nav link hover', async ({ page }) => {
    await visit(page, routes.home);
    const link = page.getByRole('link', { name: 'All Users' });
    await link.hover();
    await expectElementShot(page, link, 'nav-link-hover.png');
  });

  test('form link hover on login', async ({ page }) => {
    await visit(page, routes.login);
    const link = page.getByRole('link', { name: 'Forgot password?' });
    await link.hover();
    await expectElementShot(page, link, 'form-link-hover.png');
  });
});

test.describe('focus and hover as the owner', () => {
  test.use({ storageState: storageState.owner });

  test('textarea focus on create post', async ({ page }) => {
    await visit(page, routes.createPost);
    const body = page.getByPlaceholder('Post goes here');
    await body.focus();
    await expectElementShot(page, body, 'create-post-textarea-focus.png');
  });

  test('account navigation hover', async ({ page }) => {
    await visit(page, routes.profileOwner);
    const button = page.getByRole('button', { name: /^All posts/ });
    await button.hover();
    await expectElementShot(page, button, 'account-nav-hover.png');
  });

  test('delete comment hover', async ({ page }) => {
    // The owner wrote the last comment on the second seeded post, so the button shows there.
    await visit(page, `/post/${ids.posts[1]}`);
    const button = page.getByRole('button', { name: 'Delete Comment' });
    await expect(button).toHaveCount(1);
    await button.hover();
    await expectElementShot(page, button, 'comment-delete-hover.png');
  });
});
