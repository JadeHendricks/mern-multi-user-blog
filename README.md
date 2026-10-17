# Mern Multi User Blog

A small multi-user blog on the MERN stack. Users register and activate their account by email, write
posts with an optional image, like and comment, and edit a profile with an avatar and social links.

It runs on your own machine with no database server: data is kept in plain files under
`server/data/`. MongoDB is optional and can be switched on later without code changes.

The API and the package it shares with the client are written in TypeScript. The client is still
JavaScript (Create React App) and is not part of this conversion.

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

`npm run dev` runs `npm run setup` and builds `shared/` first, so you can skip that step. It then runs
three processes: `tsc --watch` on `shared/`, the API under `tsx watch` (it restarts when a server
file or `shared/dist` changes, so an edit in `shared/src` reaches the API a moment later) and the Vite
dev server. Vite must own port 3000 (`strictPort`: it fails instead of picking another port) and it proxies API
and image requests (`/api`, `/uploads`) to the API on port 5000.

To run what you would deploy, use `npm start`: it compiles `shared/` and `server/` to `dist/` and starts
the compiled server with plain `node` (no tsx).

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
| `npm run setup` | Create `.env` with a random `JWT_SECRET` if there is none (runs through `tsx`). |
| `npm run dev` | `shared` watch (`dev:shared`), API under `tsx watch` (`dev:api`) and client (`dev:web`) together. |
| `npm run dev:shared`, `dev:api`, `dev:web` | Only one of the three. |
| `npm run build` | Compile `shared/` and `server/` to `dist/`, then build the client into `client/dist`. |
| `npm run build:shared`, `npm run build:api` | Only `shared/`, or `shared/` plus `server/`. |
| `npm start` | Build `shared/` and `server/`, then start the compiled API (`node server/dist/src/server.js`). With `NODE_ENV=production` it also serves `client/dist` (hashed files under `assets/` are cached as immutable, `index.html` is not, and unknown page routes fall back to `index.html`). |
| `npm run typecheck` | `tsc -b`: builds `shared/`, then type-checks the server (sources, scripts, tests), the shared tests and the root scripts. Nothing is emitted except `shared/dist`. |
| `npm run seed [-- --reset]` | Fill the store with demo data (runs the TypeScript through `tsx`). |
| `npm run db:export [-- file]` | Export users and posts to JSON. |
| `npm run db:import -- file [--replace] [--driver d] [--allow-remote]` | Import an export file. |
| `npm run lint` | ESLint with type-aware rules on all server, shared and root-script TypeScript and the React client (`eslint-plugin-react`, `react-hooks`, `jsx-a11y`). |
| `npm run format`, `npm run format:check` | Prettier (legacy files are skipped, see `.prettierignore`). |
| `npm test` | `test:api` and `test:client`. |
| `npm run test:api` | Vitest + supertest on the JSON store, plus the store contract tests on both stores and the shared package tests. |
| `npm run test:api:mongo` | The same API tests on the Mongo store (in-memory MongoDB). |
| `npm run test:client` | Client unit tests (Vitest + jsdom + Testing Library). |
| `npm run test:e2e` | Playwright: screenshots, smoke flows, axe report. Builds `shared/` and `server/` first (`pretest:e2e`) because it runs the compiled API. |
| `npm run test:e2e:update` | Re-record screenshot baselines (only for intended visual changes). |
| `npm run e2e:install` | Download the Chromium build Playwright uses. |
| `npm run serve:memory` | Compiled API on :5000 with seeded throwaway data, to click around by hand. |
| `npm run check` | lint + typecheck + `test:api` + `test:api:mongo` + `test:client` + `test:e2e`. Run before a commit. |

Scripts inside `server/` (`npm run <name> -w server`) add the compiled variants `seed:dist`,
`db:export:dist` and `db:import:dist`, which run `node dist/scripts/<name>.js` instead of `tsx`.
Both produce the same output; the `:dist` ones prove the build.

## TypeScript layout and how types flow

```text
shared/src (zod schemas)  --z.infer-->  DTO and request types  -->  server (views, controllers, validateBody)
                                                                -->  client (Phase 6: not wired yet)
```

- `shared/` (`@mern-blog/shared`) holds the zod schemas for requests and responses, plus the constants.
  A DTO type is always `z.infer` of its schema, so a shape is defined once.
- The server's repository views keep `Date` objects. A compile-time check (`server/src/store/types.check.ts`)
  proves each view, once turned into JSON, still fits its DTO, and `sendJson` in `src/lib/respond.ts`
  makes every response body prove the same.
- `validateBody(schema)` (`src/lib/validate.ts`) runs the shared request schemas and answers
  `422 { message }`; a valid body reaches the controller unchanged.
- `shared` is compiled (`shared/dist`, ES2020) because Node and the client's JavaScript tooling cannot load TypeScript from
  `node_modules`. The server's Vitest config aliases the package to `shared/src` so tests never see a stale build.
- The compiler settings are in `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, NodeNext). TypeScript is pinned
  to 6.0.x because `typescript-eslint` does not support 7 yet. Relative imports keep their `.js` extension.
- `server/tsconfig.json` is the type-check project (noEmit, includes tests); `server/tsconfig.build.json`
  emits `server/dist/src` and `server/dist/scripts` (`rootDir` is `server/`, so the folders keep their depth).
  `server/build-assets.mjs` then copies `scripts/seed-data.cjs`, the one CommonJS file (Playwright must
  `require` it), next to the compiled seed script.
- `any`, `@ts-ignore` and unexplained non-null assertions are lint errors in `server/` and `shared/`.

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

- **Validation:** request bodies are validated with zod schemas from `@mern-blog/shared`, written to
  answer exactly as the old `express-validator` chains did (about 550 recorded bodies pin it). One
  difference is deliberate: only the body is validated, no longer the query string, cookies or headers.
  Settings, pagination parameters and import files use `zod` too.
- **Storage:** JSON files by default so the project runs anywhere with no setup; Mongo sits behind the
  same interface for when you want it.
- **Dependencies:** `npm audit` reports 0 vulnerabilities. Dates use `Intl` (`client/src/lib/formatDate.js`)
  instead of `moment`, and requests go through `fetch` in `client/src/lib/api.js` instead of `axios`.
- **Client build:** Vite replaced create-react-app 3.4. Measured sizes and audit counts:

| | Before (CRA 3.4) | After (Vite 8) |
| --- | --- | --- |
| Main JS, gzip | 94,687 B (3 chunks) | 92,302 B (1 chunk) |
| CSS, gzip | 6,063 B (2 files) | 5,542 B (1 file) |
| `npm audit` (all and `--omit=dev`) | 196 (11 low, 134 moderate, 46 high, 5 critical) | 3 high |
| `express` copies in `npm ls` | 5.3.0 and 4.17.1 | 5.3.0 only |

## Workspace layout

```text
server/           Express 5 API (TypeScript, ESM)
  src/app.ts        app factory: createApp({ store, mailer })
  src/server.ts     reads config, opens the store, listens, shuts down cleanly
  src/modules/      auth, users, posts (routes and controller each)
  src/store/        json/ and mongo/ adapters behind one repository interface (types.ts)
  src/lib/          mailer, upload, pagination, tokens, password, validate, paths, ...
  src/types/        express.d.ts (adds req.user)
  scripts/          seed, db-export, db-import (+ seed-data.cjs, the one CommonJS file)
  seed-assets/      sample images copied by the seed
  test/             api, store and unit tests (TypeScript)
  dist/             compiled output of src/ and scripts/ (generated, gitignored)
client/           React 16 app (Vite, JavaScript; `tsconfig.json` allows TypeScript files to be added one by one)
shared/           @mern-blog/shared: zod schemas, DTO types, constants
  dist/             compiled package the server and client load (generated, gitignored)
e2e/              Playwright specs (CommonJS JavaScript), support and screenshot baselines
scripts/          setup.mts
tsconfig.base.json shared compiler options
tsconfig.json     solution file for `npm run typecheck`
```

## Roadmap

Phases 4 to 9 (client modernisation, state, styling, accessibility, performance and deployment) are
planned separately and are not part of this setup.
