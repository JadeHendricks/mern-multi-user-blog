# API characterisation tests

`npm run test:api` runs Vitest + supertest against the Express app on the storage driver named by\n`TEST_DB_DRIVER` (`json` by default: a JSON-file store in a temp folder, no database server needed). The tests record today's behaviour, including known
bugs (titles start with `KNOWN BUG <id>`). They do not fix anything.

## How config is injected

The app validates `process.env` with zod in `src/config.ts` and never reads a `.env` file
itself (the dev and start scripts pass `--env-file-if-exists`, the test scripts do not).
`test/api/support/env.ts` is a Vitest `setupFiles` module, so it runs in every worker before the
test file (and before `app.ts`) is loaded. It sets:

- `JWT_SECRET`, `CLIENT_URL`, `EMAIL_FROM`, `EMAIL_REPLY`, `SG_API_KEY`,
  `COOKIE_EXPIRES_IN`: random fake values generated per run.
- `DATA_DIR` and `MAIL_TRANSPORT=file`: mail is written to `<DATA_DIR>/outbox` instead of
  SendGrid. Tests read the activation and reset links from there. A test that needs SendGrid passes
  `loadApp({ mailer: createMailer({ MAIL_TRANSPORT: 'sendgrid', ... }) })` and stubs `send`.
- Uploads land in `<DATA_DIR>/uploads` (a temp folder), not in `client/src/assets/images`.

The temp folder is `os.tmpdir()/mern-blog-test-<random>` and is removed after each test file.
Child processes (see `crash-server.ts`) receive the same env.

Each test file runs in its own forked process (`pool: 'forks'`, files run one after another), so
every file gets a fresh config, store and app. `support/db.ts` creates the store (`connectDb`),\nempties it between tests (`clearDb`) and removes it (`disconnectDb`); `getStore()` gives tests\nthe repos and `store.admin` (counts, raw user with secrets, `patchUser` to move expiry dates)\ninstead of poking a database driver. `loadApp()` in `support/helpers.ts` builds the app with\n`createApp({ store })`.

## MongoDB binary (TEST_DB_DRIVER=mongo only)

`global-setup.ts` starts, only for the Mongo driver, one `MongoMemoryServer`. The first run downloads a MongoDB binary (once,
cached under `node_modules/.cache/mongodb-memory-server`). The default binary (8.2.6 at the time of
writing) works with Mongoose 5.9. If a future default does not, pin an older one, either with the
env var or in `global-setup.ts`:

``powershell
$env:MONGOMS_VERSION = '6.0.14'   # then 5.0.x if 6.0 still fails
``

## Known-bug convention

- `test.fails('KNOWN BUG B2 ...')` asserts the secure outcome while the bug exists. When the bug is
  fixed the test starts failing; remove the `.fails` wrapper in the same change.
- Tests that pin today's (wrong) behaviour have `KNOWN BUG <id>` in the title and say what the fix
  should flip.
- Payload tests assert key names only, never values. Tokens and hashes are never logged.

## Types in the tests

The tests are TypeScript and run through Vitest (no build step). Assertions are the same as they were
in JavaScript; the helpers below only carry types.

- supertest types `res.body` as `any` (it is whatever the server sent). `bodyOf<T>(res)` in
  `support/helpers.ts` is the one place that states what a body should look like; use it where a body flows
  into typed code. The four `no-unsafe-*` lint rules are off under `server/test` for the same reason
  (`no-explicit-any` stays on, so a test cannot write an `any` itself).
- `stubStore()` builds a `Store` with only the repos a test fills in; `rawUser()`, `present()` and
  `likesOf()` turn a `null` or missing answer into a clear error instead of a `TypeError`.
- A deliberately wrong input (an undefined id, an import without `posts`) carries a
  `@ts-expect-error` with the reason.
- `crash-server.ts` is a real node process started with `--import tsx`, so it can crash without
  taking Vitest down.
