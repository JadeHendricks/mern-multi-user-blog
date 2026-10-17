// Starts the real Express app on port 5000 against the JSON-file store in a temp folder, seeded first.
// Used by Playwright's webServer and by `npm run serve:memory` (browse the seeded app locally).
// Nothing outlives the run, and no SendGrid call can happen: mail goes to a temp folder.
// No database server is needed, so this starts in a moment.
const { randomBytes } = require('node:crypto');
const { mkdirSync, mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  E2E_PASSWORD,
  SEED_ACTIVATION_TOKEN,
  PENDING_USER,
  SEED_IDS,
  SEED_USERS,
  SEED_POSTS,
} = require('../../server/scripts/seed-data.cjs');

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
  DB_DRIVER: 'json',
});
// Development mode enables the CORS rule and keeps cookies usable over plain http.
process.env.NODE_ENV = 'development';

const PORT = 5000;

// Fixed ids and dates, so screenshots look the same on every run. Replaced by the shared seed
// script when it moves to the repos; until then this does the same inserts through them.
const CREATED_AT = new Date('2025-11-20T09:00:00.000Z');

async function seed(store) {
  const { hashPassword } = await load('../../server/src/lib/password.js');
  const { hashToken } = await load('../../server/src/lib/tokens.js');
  // One hash for every account: they all share the throwaway password.
  const passwordHash = await hashPassword(E2E_PASSWORD);

  for (const spec of SEED_USERS) {
    await store.users.create({
      _id: SEED_IDS.users[spec.key],
      name: spec.name,
      email: spec.email,
      passwordHash,
      status: 'active',
      createdAt: CREATED_AT,
      ...(spec.socials && { socials: spec.socials }),
    });
  }
  // Pending until the activation link is used; the far-future expiry keeps screenshots stable.
  await store.users.create({
    ...PENDING_USER,
    passwordHash,
    status: 'pending',
    createdAt: CREATED_AT,
    activationHash: hashToken(SEED_ACTIVATION_TOKEN),
    activationExpires: new Date('2099-01-01T00:00:00.000Z'),
  });

  await store.posts.insertMany(
    SEED_POSTS.map((spec, index) => ({
      _id: SEED_IDS.posts[index],
      user: spec.author,
      title: spec.title,
      tag: spec.tag,
      description: spec.description,
      date: new Date(spec.date),
      likes: spec.likes.map((id) => ({ user: id })),
      comments: spec.comments.map((comment, i) => ({
        _id: `64d0000000000000000${index}0${i}`.padEnd(24, '0').slice(0, 24),
        user: comment.by,
        comment: comment.text,
        date: new Date(comment.date),
      })),
    })),
  );
  return { users: SEED_USERS.length, posts: SEED_POSTS.length, pending: 1 };
}

async function main() {
  const { createStore } = await load('../../server/src/store/index.js');
  const { createApp } = await load('../../server/src/app.js');

  const store = await createStore({ DB_DRIVER: 'json', DATA_DIR: dataDir, BACKUP_KEEP: 3 });
  await store.init();
  const counts = await seed(store);

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
