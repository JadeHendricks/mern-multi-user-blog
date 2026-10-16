// Logs the seeded owner and visitor in over the API and stores their cookies for the specs.
// Runs after the webServer entries are up, so the API on port 5000 is ready.
const { mkdirSync } = require('node:fs');
const { request } = require('@playwright/test');
const { owner, visitor, storageState, authDir } = require('./support/seed-data');

async function loginAndSave(user, file) {
  // Cookies are scoped to the host "localhost", not the port, so a login on the API (5000) is also
  // sent by the browser when the client on port 3000 proxies its API calls.
  const context = await request.newContext({ baseURL: 'http://localhost:5000' });
  const res = await context.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  });
  if (!res.ok()) throw new Error(`E2E login failed for a seeded user (status ${res.status()})`);
  await context.storageState({ path: file });
  await context.dispose();
}

module.exports = async function globalSetup() {
  mkdirSync(authDir, { recursive: true });
  await loginAndSave(owner, storageState.owner);
  await loginAndSave(visitor, storageState.visitor);
};
