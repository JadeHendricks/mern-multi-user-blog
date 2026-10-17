# Mern Multi User Blog

A small multi-user blog on the MERN stack. Users register and activate their account by email, write
posts with an optional image, like and comment, and edit a profile with an avatar and social links.

It runs on your own machine with no database server: data is kept in plain files under
`server/data/`. MongoDB is optional and can be switched on later without code changes.

## Prerequisites

- Node.js 24 or newer (`.nvmrc` pins it; `nvm use` picks it up) and npm 11.
- Nothing else for day-to-day work. MongoDB is only needed if you choose `DB_DRIVER=mongo`.

## Quick start

```bash
npm install        # once, at the repo root: installs the server, client and shared workspaces
npm run setup      # creates .env from .env.example with a random JWT_SECRET (never overwrites an existing .env)
npm run seed       # optional: fills the store with demo users, posts and pictures
npm run dev        # API on http://localhost:5000 and the client on http://localhost:3000
```

`npm run dev` runs `npm run setup` first, so you can skip that step. The API restarts when its files
change (`node --watch`). The client uses the CRA dev server, which proxies API and image requests
(`/api`, `/uploads`) to the API.

### Demo data

`npm run seed` fills an empty store with four active users (Alice, Bob, Carol, Dan), one pending user,
six posts with comments and likes, and sample pictures. Use `npm run seed -- --reset` to wipe the
store and its uploads folder first. The accounts share one throwaway password, `E2e-Throwaway-1!`
(defined in `server/scripts/seed-data.cjs`); the emails are `alice@example.test`, `bob@example.test`
and so on. The password is only for demo data and is not a secret. Do not seed a store you care about.

### Where your data lives

Everything is under `server/data/` (gitignored, created on first start). Change it with `DATA_DIR`.

```text
server/data/
  db.json          users and posts (the JSON store; written atomically, whole file per write)
  backups/         rolling copies of db.json (the newest BACKUP_KEEP are kept)
  uploads/         post images in posts/, avatars in users/ (served at /uploads)
  outbox/          emails the app "sent" (see below)
  exports/         files made by npm run db:export
  .lock            pid of the running process, so a second process cannot corrupt db.json
```

Only one process can open the JSON store at a time. `npm run seed` and `db:import` refuse to run
while `npm run dev` holds it; stop the dev server first. If a crash left a stale `.lock`, the next
start removes it when its pid is gone.

### Emails in development

With `MAIL_TRANSPORT=file` (the default) nothing is sent. Each email is written as a JSON file in
`server/data/outbox/` with `from`, `to`, `subject`, `html` and `createdAt`. After registering or asking
for a password reset, open the newest file and copy the link from its `html` into the browser.
Set `MAIL_TRANSPORT=sendgrid` plus `SG_API_KEY`, `EMAIL_FROM` and `EMAIL_REPLY` to send real mail.

## Configuration

Settings come from environment variables; `npm run setup` writes a `.env` from `.env.example`. The
file is read only by the npm scripts and is never committed. Invalid values stop the server at start
with a message that names the key (never the value).

| Key | Default | Notes |
| --- | --- | --- |
| `JWT_SECRET` | none | Required, at least 32 characters. `npm run setup` generates one. |
| `PORT` | `5000` | API port. |
| `CLIENT_URL` | `http://localhost:3000` | Browser origin: used in email links and CORS (development). |
| `DB_DRIVER` | `json` | `json` (files) or `mongo`. |
| `DATA_DIR` | `server/data` | Root for db.json, backups, uploads, outbox and exports. |
| `MONGO_URI` | none | Required when `DB_DRIVER=mongo`. |
| `COOKIE_EXPIRES_IN` | `7` | Session length in days. |
| `MAIL_TRANSPORT` | `file` | `file` or `sendgrid`. |
| `SG_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY` | none | Required when `MAIL_TRANSPORT=sendgrid` (`EMAIL_FROM` has a local default otherwise). |
| `AUTH_RATE_LIMIT_MAX` | `10` | Attempts allowed per window on each auth endpoint. |
| `BACKUP_KEEP` | `10` | Number of rolling db.json backups to keep. |
| `NODE_ENV` | `development` | `development`, `test` or `production`. |

## Switching to MongoDB

The file store and the Mongo store implement the same repository interface, so the app does not
change. To try Mongo locally:

```bash
docker run -d --name blog-mongo -p 27017:27017 mongo:8     # or use a local mongod
# then in .env
DB_DRIVER=mongo
MONGO_URI=mongodb://127.0.0.1:27017/blog
```

Move your data across with the export and import scripts (they work in both directions):

```bash
npm run db:export                         # writes server/data/exports/export-<UTC time>.json
npm run db:export -- backup.json          # or to a path you choose
npm run db:import -- <file.json> [--replace] [--driver json|mongo]
```

- The export file contains password hashes. Treat it as sensitive; the default folder is gitignored.
- `db:import` refuses a store that already has data unless you pass `--replace`.
- `db:import` and `seed` refuse a Mongo server that is not on this machine (anything other than
  `localhost`, `127.0.0.1` or `::1`, and every `mongodb+srv://` address). `--allow-remote` overrides
  that. The connection string is never printed.
- Uploaded images are plain files in `DATA_DIR/uploads`; copy that folder yourself when you move.

## Scripts

Run from the repo root.

| Script | What it does |
| --- | --- |
| `npm run setup` | Create `.env` with a random `JWT_SECRET` if there is none. |
| `npm run dev` | API (`dev:api`) and client (`dev:web`) together. |
| `npm run dev:api`, `npm run dev:web` | Only one of the two. |
| `npm start` | Start the API once (no watch). With `NODE_ENV=production` it also serves `client/build`. |
| `npm run build` | Production build of the client into `client/build`. |
| `npm run seed [-- --reset]` | Fill the store with demo data. |
| `npm run db:export [-- file]` | Export users and posts to JSON. |
| `npm run db:import -- file [--replace] [--driver d] [--allow-remote]` | Import an export file. |
| `npm run lint` | ESLint (the client keeps its own CRA lint). |
| `npm run format`, `npm run format:check` | Prettier (legacy files are skipped, see `.prettierignore`). |
| `npm test` | `test:api` and `test:client`. |
| `npm run test:api` | Vitest + supertest on the JSON store, plus the store contract tests on both stores. |
| `npm run test:api:mongo` | The same API tests on the Mongo store (in-memory MongoDB). |
| `npm run test:client` | Client unit tests (react-scripts / Jest). |
| `npm run test:e2e` | Playwright: screenshots, smoke flows, axe report. |
| `npm run test:e2e:update` | Re-record screenshot baselines (only for intended visual changes). |
| `npm run e2e:install` | Download the Chromium build Playwright uses. |
| `npm run serve:memory` | API on :5000 with seeded throwaway data, to click around by hand. |
| `npm run check` | lint + `test:api` + `test:api:mongo` + `test:client` + `test:e2e`. Run before a commit. |

## API notes

- Lists are not paged by default. `GET /api/post`, `GET /api/post/user/:id` and `GET /api/user` return
  everything plus `nextCursor: null`. Add `?limit=1..100` and `?cursor=<nextCursor>` to page; bad values
  answer `422`. Posts are newest first, users oldest first.
- Uploaded images are served at `/uploads/posts/<name>` and `/uploads/users/<name>` with a long cache
  lifetime. `default.jpg` is a bundled client asset and is not served from there.
- API shapes are pinned by `server/test/api/contracts.test.ts`; changing it is an API change.

## Tests

None of the tests need real config, a real database server or a network service. Mongo runs through
`mongodb-memory-server` (the first run downloads a MongoDB binary), config values are fake, and email
goes to a temp folder. Details are in `server/test/README.md` and `e2e/README.md`.

```bash
npm run e2e:install    # once
npm run check
```

- Screenshot baselines live in `e2e/__screenshots__` and are compared with zero tolerance. They were
  rendered on Windows and need regenerating when CI moves to Linux.
- Ports 3000 and 5000 must be free while the E2E tests run. E2E uses the JSON store by default;
  `E2E_DB_DRIVER=mongo npm run test:e2e` runs it on the in-memory Mongo.

## Decisions

- **Validation:** request bodies are validated with `express-validator` (the messages the client shows
  are pinned by tests). Settings, pagination parameters and import files use `zod`. Both stay: moving
  request validation to zod is a possible later cleanup, not needed now.
- **Storage:** JSON files by default so the project runs anywhere with no setup; Mongo sits behind the
  same interface for when you want it.

## Workspace layout

```text
server/           Express 5 API (ESM)
  src/app.js        app factory: createApp({ store, mailer })
  src/server.js     reads config, opens the store, listens, shuts down cleanly
  src/modules/      auth, users, posts (routes, controller, schema each)
  src/store/        json/ and mongo/ adapters behind one repository interface
  src/lib/          mailer, upload, pagination, tokens, password, ...
  scripts/          seed, db-export, db-import
  seed-assets/      sample images copied by the seed
  test/             api, store and unit tests
client/           React 16 app (create-react-app 3.4)
shared/           placeholder workspace for code shared later
e2e/              Playwright specs, support and screenshot baselines
scripts/          setup.mjs
```

## Roadmap

Phases 3 to 9 (client modernisation, state, styling, accessibility, performance and deployment) are
planned separately and are not part of this setup.
