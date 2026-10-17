// Starts the real Express app on port 5000 against a store in a temp folder, seeded first by the same
// seed() that `npm run seed` uses. E2E_DB_DRIVER picks the store: json (default) or mongo, which runs
// on a throwaway in-memory MongoDB.
// Used by Playwright's webServer and by `npm run serve:memory` (browse the seeded app locally).
// Nothing outlives the run, and no SendGrid call can happen: mail goes to a temp folder.
// The JSON store needs no database server, so the default starts in a moment.
const { randomBytes } = require('node:crypto');
const { mkdirSync, mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// The server is an ES module package; this launcher stays CommonJS, so it loads it with import().
const load = (relative) => import(pathToFileURL(path.join(__dirname, relative)).href);

const fake = (label) => `e2e-${label}-${randomBytes(16).toString('hex')}`;
const runDir = mkdtempSync(path.join(tmpdir(), 'mern-blog-e2e-'));
const dataDir = path.join(runDir, 'data');
for (const sub of ['posts', 'users', 'outbox']) mkdirSync(path.join(runDir, sub));
mkdirSync(dataDir);

// Fake, per-run values. They are not real credentials and are never printed. A real .env is
// never loaded here: this launcher is started with plain `node`, without --env-file.
Object.assign(process.env, {
  CLIENT_URL: 'http://localhost:3000',
  EMAIL_FROM: 'noreply@example.test',
  JWT_SECRET: fake('jwt'),
  COOKIE_EXPIRES_IN: '1',
  // Many logins from one IP are expected during E2E runs
  AUTH_RATE_LIMIT_MAX: '1000',
  MAIL_TRANSPORT: 'file',
  // Mail goes to <DATA_DIR>/outbox; the store keeps its files in DATA_DIR too
  DATA_DIR: runDir,
  UPLOAD_DIR: runDir,
});
// Development mode enables the CORS rule and keeps cookies usable over plain http.
process.env.NODE_ENV = 'development';

const PORT = 5000;
let memoryMongo;

async function main() {
  const { createStore } = await load('../../server/src/store/index.js');
  const { createApp } = await load('../../server/src/app.js');

  const { seed } = await load('../../server/scripts/seed.js');
  const driver = process.env.E2E_DB_DRIVER ?? 'json';
  if (!['json', 'mongo'].includes(driver)) throw new Error('E2E_DB_DRIVER must be json or mongo');
  // The mongo store runs on a throwaway in-memory server, never a real database.
  memoryMongo =
    driver === 'mongo' ? await (await import('mongodb-memory-server')).MongoMemoryServer.create() : undefined;
  const store = await createStore({
    DB_DRIVER: driver,
    DATA_DIR: dataDir,
    BACKUP_KEEP: 3,
    MONGO_URI: memoryMongo?.getUri('e2e'),
  });
  await store.init();
  const counts = await seed(store, { dataDir: runDir });

  const server = createApp({ store }).listen(PORT, () => {
    console.log(
      `E2E API on http://localhost:${PORT} (seeded ${counts.users} users, ${counts.pending} pending, ${counts.posts} posts)`,
    );
  });

  let closing = false;
  const shutdown = async () => {
    if (closing) return;
    closing = true;
    server.close();
    await store.close().catch(() => {});
    await memoryMongo?.stop().catch(() => {});
    rmSync(runDir, { recursive: true, force: true });
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  memoryMongo?.stop().catch(() => {});
  rmSync(runDir, { recursive: true, force: true });
  process.exit(1);
});
