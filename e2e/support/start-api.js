// Starts the real Express app on port 5000 against an in-memory MongoDB that is seeded first.
// Used by Playwright's webServer and by `npm run serve:memory` (browse the seeded app locally).
// Nothing is persisted. No SendGrid call can happen: mail goes to a temp folder.
//
// Playwright starts webServer entries before globalSetup, so this script has to start the
// database itself instead of relying on a global setup.
const { randomBytes } = require('node:crypto');
const { mkdirSync, mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const fake = (label) => `e2e-${label}-${randomBytes(16).toString('hex')}`;
const runDir = mkdtempSync(path.join(tmpdir(), 'mern-blog-e2e-'));
for (const sub of ['posts', 'users', 'outbox']) mkdirSync(path.join(runDir, sub));

// Fake, per-run values. They are not real credentials and are never printed.
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
// An empty folder, so a real config/*.json on the machine can never leak into this run.
process.env.NODE_CONFIG_DIR = path.join(runDir, 'config');
mkdirSync(process.env.NODE_CONFIG_DIR);
// Many logins from one IP are expected during E2E runs
process.env.AUTH_RATE_LIMIT_MAX = '1000';
process.env.MAIL_TRANSPORT = 'file';
process.env.MAIL_OUTBOX_DIR = path.join(runDir, 'outbox');
process.env.UPLOAD_DIR = runDir;
// Development mode enables the CORS rule and keeps cookies usable over plain http.
process.env.NODE_ENV = 'development';

const PORT = 5000;

async function main() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongoose = require('mongoose');
  const { seed } = require('../../server/scripts/seed');

  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(`${mongod.getUri()}e2e`, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });
  await require('../../server/src/models/UserModel').init();
  await require('../../server/src/models/PostModel').init();
  const counts = await seed(mongoose);

  const app = require('../../server/src/app');
  const server = app.listen(PORT, () => {
    console.log(
      `E2E API on http://localhost:${PORT} (seeded ${counts.users} users, ${counts.pending} pending, ${counts.posts} posts)`,
    );
  });

  let closing = false;
  const shutdown = async () => {
    if (closing) return;
    closing = true;
    server.close();
    await mongoose.disconnect().catch(() => {});
    await mongod.stop().catch(() => {});
    rmSync(runDir, { recursive: true, force: true });
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  rmSync(runDir, { recursive: true, force: true });
  process.exit(1);
});
