// Informational accessibility report. Desktop project only.
// Axe results are attached to the report and summarised in the console. This spec never fails on
// violations: the findings feed Phase 8, they do not gate Phase 0.
const AxeBuilder = require('@axe-core/playwright').default;
const { test, visit, visitForgotPassword, routes, storageState } = require('./fixtures');

const anonymousRoutes = [
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
const ownerRoutes = [
  ['create-post', routes.createPost],
  ['edit-post', routes.editPost],
];

async function report(page, name, testInfo) {
  const results = await new AxeBuilder({ page }).analyze();
  await testInfo.attach(`axe-${name}.json`, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });
  const byImpact = {};
  for (const violation of results.violations) {
    const impact = violation.impact || 'unknown';
    byImpact[impact] = (byImpact[impact] || 0) + violation.nodes.length;
  }
  console.log(
    `axe ${name}: ${results.violations.length} rules violated, nodes by impact ${JSON.stringify(byImpact)}`,
  );
}

test.describe('axe, anonymous', () => {
  for (const [name, route] of anonymousRoutes) {
    test(name, async ({ page }, testInfo) => {
      await visit(page, route);
      await report(page, name, testInfo);
    });
  }

  test('forgot-password', async ({ page }, testInfo) => {
    await visitForgotPassword(page);
    await report(page, 'forgot-password', testInfo);
  });
});

test.describe('axe, owner', () => {
  test.use({ storageState: storageState.owner });

  for (const [name, route] of ownerRoutes) {
    test(name, async ({ page }, testInfo) => {
      await visit(page, route);
      await report(page, name, testInfo);
    });
  }
});
