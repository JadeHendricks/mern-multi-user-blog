// Runs in every test worker BEFORE the test file (and therefore before app.js) is loaded.
// The app reads its settings from process.env (see src/config.js), so the fake values go there.
import { randomBytes } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll } from 'vitest';

const fake = (label) => `test-${label}-${randomBytes(16).toString('hex')}`;

const runDir = mkdtempSync(path.join(tmpdir(), 'mern-blog-test-'));
for (const sub of ['posts', 'users', 'outbox']) mkdirSync(path.join(runDir, sub));

// All values are generated here and are not real credentials. A real .env is never loaded:
// the test scripts do not pass --env-file, and these assignments win anyway.
Object.assign(process.env, {
  CLIENT_URL: 'http://localhost:3000',
  SG_API_KEY: `SG.${fake('sendgrid')}`,
  EMAIL_FROM: 'noreply@example.test',
  EMAIL_REPLY: 'reply@example.test',
  JWT_SECRET: fake('jwt'),
  COOKIE_EXPIRES_IN: '1',
  // High so normal tests never hit the auth limiter; rate-limit.test.js lowers it.
  AUTH_RATE_LIMIT_MAX: '1000',
  MAIL_TRANSPORT: 'file',
  // Mail goes to <DATA_DIR>/outbox; uploads go to UPLOAD_DIR, so nothing lands in client/.
  DATA_DIR: runDir,
  UPLOAD_DIR: runDir,
});

afterAll(() => {
  rmSync(runDir, { recursive: true, force: true });
});
