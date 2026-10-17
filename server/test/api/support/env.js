// Runs in every test worker BEFORE the test file (and therefore before app.js) is loaded.
// The `config` package reads NODE_CONFIG / NODE_CONFIG_DIR once, when it is first required.
import { randomBytes } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll } from 'vitest';

const fake = (label) => `test-${label}-${randomBytes(16).toString('hex')}`;

const here = path.dirname(fileURLToPath(import.meta.url));
const runDir = mkdtempSync(path.join(tmpdir(), 'mern-blog-test-'));
for (const sub of ['posts', 'users', 'outbox']) mkdirSync(path.join(runDir, sub));

// All values are generated here and are not real credentials.
process.env.NODE_CONFIG = JSON.stringify({
  MONGO_URI2: 'mongodb://127.0.0.1:1/unused-<PASSWORD>',
  MONGO_PASSWORD: fake('mongo'),
  CLIENT_URL: 'http://localhost:3000',
  SG_API_KEY: `SG.${fake('sendgrid')}`,
  EMAIL_FROM: 'noreply@example.test',
  EMAIL_REPLY: 'reply@example.test',
  JWT_SECRET: fake('jwt'),
  JWT_ACCOUNT_ACTIVATION: fake('activation'),
  JWT_RESET_PASSWORD: fake('reset'),
  COOKIE_EXPIRES_IN: 1,
});
// An empty folder, so no real config/*.json on the machine can leak into a test run.
process.env.NODE_CONFIG_DIR = path.join(here, 'fixtures', 'config');
// High so normal tests never hit the auth limiter; rate-limit.test.js lowers it.
process.env.AUTH_RATE_LIMIT_MAX = '1000';
process.env.MAIL_TRANSPORT = 'file';
process.env.MAIL_OUTBOX_DIR = path.join(runDir, 'outbox');
process.env.UPLOAD_DIR = runDir;
process.env.TEST_RUN_DIR = runDir;

afterAll(() => {
  rmSync(runDir, { recursive: true, force: true });
});
