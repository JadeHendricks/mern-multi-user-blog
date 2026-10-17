# API characterisation tests

`npm run test:api` runs Vitest + supertest against the current Express 4 / Mongoose 5 code with an
in-memory MongoDB (`mongodb-memory-server`). The tests record today's behaviour, including known
bugs (titles start with `KNOWN BUG <id>`). They do not fix anything.

## How config is injected

The app reads settings with the `config` package, and this machine has no `config/*.json`.
`test/api/support/env.js` is a Vitest `setupFiles` module, so it runs in every worker before the
test file (and before `app.js`) is loaded. It sets:

- `NODE_CONFIG`: a JSON string with all 10 keys, filled with random fake values generated per run.
  `config` merges it over any files, so no application code changes.
- `NODE_CONFIG_DIR`: an empty folder (`test/api/support/fixtures/config`), so a real
  `config/default.json` can never leak into a run.
- `MAIL_TRANSPORT=file` and `MAIL_OUTBOX_DIR`: mail is written to a temp folder instead of SendGrid.
  Tests read the activation and reset links from there.
- `UPLOAD_DIR`: uploads land in a temp folder, not in `client/src/assets/images`.

The temp folder is `os.tmpdir()/mern-blog-test-<random>` and is removed after each test file.
Child processes (see `crash-server.js`) receive the same env.

Each test file runs in its own forked process (`pool: 'forks'`, files run one after another), so
every file gets a fresh `config`, mongoose and app. The app is loaded with `createRequire`, because
`app.js` is CommonJS and the models assign implicit globals.

## MongoDB binary

`global-setup.js` starts one `MongoMemoryServer`. The first run downloads a MongoDB binary (once,
cached under `node_modules/.cache/mongodb-memory-server`). The default binary (8.2.6 at the time of
writing) works with Mongoose 5.9. If a future default does not, pin an older one, either with the
env var or in `global-setup.js`:

```powershell
$env:MONGOMS_VERSION = '6.0.14'   # then 5.0.x if 6.0 still fails
```

## Known-bug convention

- `test.fails('KNOWN BUG B2 ...')` asserts the secure outcome while the bug exists. When the bug is
  fixed the test starts failing; remove the `.fails` wrapper in the same change.
- Tests that pin today's (wrong) behaviour have `KNOWN BUG <id>` in the title and say what the fix
  should flip.
- Payload tests assert key names only, never values. Tokens and hashes are never logged.
