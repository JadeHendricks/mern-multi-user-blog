# Mern Multi User Blog

A small multi-user blog on the MERN stack. Users register and activate their account by email, write
posts with an optional image, like and comment, and edit a profile with an avatar and social links.

It runs on your own machine with no database server: data is kept in plain files under
`server/data/`. MongoDB is optional and can be switched on later without code changes.

The API, the package it shares with the client and the React client are all written in TypeScript.

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
| `npm run build` | Compile `shared/` and `server/` to `dist/`, then build the client into `client/dist`. The client's `prebuild` compiles `shared/` first, so `npm run build -w client` also works on a fresh clone. |
| `npm run build:shared`, `npm run build:api` | Only `shared/`, or `shared/` plus `server/`. |
| `npm start` | Build `shared/` and `server/`, then start the compiled API (`node server/dist/src/server.js`). With `NODE_ENV=production` it also serves `client/dist` (hashed files under `assets/` are cached as immutable, `index.html` is not, and unknown page routes fall back to `index.html`). |
| `npm run typecheck` | `tsc -b`: builds `shared/`, then type-checks the server (sources, scripts, tests), the client (app, tests and Vite config as three projects), the shared tests and the root scripts. Nothing is emitted except `shared/dist`. |
| `npm run seed [-- --reset]` | Fill the store with demo data (runs the TypeScript through `tsx`). |
| `npm run db:export [-- file]` | Export users and posts to JSON. |
| `npm run db:import -- file [--replace] [--driver d] [--allow-remote]` | Import an export file. |
| `npm run lint` | ESLint with type-aware strict rules on all TypeScript (server, shared, root scripts and the React client, which also gets `eslint-plugin-react`, `react-hooks` and `jsx-a11y`). |
| `npm run format`, `npm run format:check` | Prettier (legacy files are skipped, see `.prettierignore`). |
| `npm test` | `test:api` and `test:client`. |
| `npm run test:api` | Vitest + supertest on the JSON store, plus the store contract tests on both stores and the shared package tests. |
| `npm run test:api:mongo` | The same API tests on the Mongo store (in-memory MongoDB). |
| `npm run test:client` | Client unit tests (Vitest + jsdom + Testing Library). |
| `npm run test:e2e` | Playwright behaviour smoke suite (no screenshots, no axe): `smoke.spec.js` on the dev server and the `prod-smoke` project (the built client served by Express). Builds `shared/`, `server/` and the client first (`pretest:e2e`), after checking that ports 3000, 5000 and 5001 are free. Not part of `check`. |
| `npm run e2e:install` | Download the Chromium build Playwright uses (once, before `test:e2e`). |
| `npm run serve:memory` | Compiled API on :5000 with seeded throwaway data, to click around by hand. |
| `npm run check` | lint + typecheck + `test:api` + `test:api:mongo` + `test:client`. It does not run E2E. Run before a commit. |

Scripts inside `server/` (`npm run <name> -w server`) add the compiled variants `seed:dist`,
`db:export:dist` and `db:import:dist`, which run `node dist/scripts/<name>.js` instead of `tsx`.
Both produce the same output; the `:dist` ones prove the build.

## TypeScript layout and how types flow

```text
shared/src (zod schemas)  --z.infer-->  DTO and request types  -->  server (views, controllers, validateBody)
                                                                -->  client (import type, see below)
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
- **Client:** `client/src` imports DTO and request types with `import type { ... } from '@mern-blog/shared'` (and only the constants it needs as values, e.g. `DEFAULT_AVATAR`; zod and `validator` are tree-shaken out of the bundle). The forms do not run the zod schemas: they send raw values and show the server's messages. Vite's dev server and Vitest alias the package to `shared/src` (no rebuild while editing); the production build and `tsc -b` read `shared/dist`, like the server.
- `PostDto.user` is a bare id on the create/edit answers but a populated author (or `null` once the account is gone) on lists and the post page. `client/src/lib/types.ts` narrows it to `PostWithAuthor` for the pages that only ever see populated posts.
- `any`, `@ts-ignore` and unexplained non-null assertions are lint errors in `server/`, `shared/` and `client/`.

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
npm run check          # lint, typecheck, API tests (JSON and Mongo) and client tests; no E2E
npm run e2e:install    # once, to download Chromium
npm run test:e2e       # the smoke suite, when you want it
```
- `npm run check` does not run E2E. `npm run test:e2e` is a small behaviour smoke suite (home, login and
  logout, route guards, social links, images, the production bundle). There are no screenshot tests.
- `prod-smoke` (`e2e/prod-smoke.spec.js`) runs against `client/dist` served by a second API instance on port
  5001, so the production bundle is checked without the Vite dev server. Run only it with
  `npm run pretest:e2e` then `npx playwright test --project=prod-smoke`.
- Ports 3000, 5000 and 5001 must be free while the E2E tests run. E2E uses the JSON store by default;
  `E2E_DB_DRIVER=mongo npm run test:e2e` runs it on the in-memory Mongo.

## Decisions

- **Validation:** request bodies are validated with zod schemas from `@mern-blog/shared`, written to
  answer exactly as the old `express-validator` chains did (about 550 recorded bodies pin it). One
  difference is deliberate: only the body is validated, no longer the query string, cookies or headers.
  Settings, pagination parameters and import files use `zod` too.
- **Storage:** JSON files by default so the project runs anywhere with no setup; Mongo sits behind the
  same interface for when you want it.
- **Dependencies:** `npm audit` reports 0 vulnerabilities. Dates use `Intl` (`client/src/lib/formatDate.ts`)
  instead of `moment`, and requests go through `fetch` in `client/src/lib/api.ts` instead of `axios`.
- **Client build:** Vite replaced create-react-app 3.4. Measured sizes and audit counts:

| | Before (CRA 3.4) | After (Vite 8) |
| --- | --- | --- |
| Main JS, gzip | 94,687 B (3 chunks) | 92,302 B (1 chunk) |
| CSS, gzip | 6,063 B (2 files) | 5,542 B (1 file) |
| `npm audit` (all and `--omit=dev`) | 196 (11 low, 134 moderate, 46 high, 5 critical) | 3 high |
| `express` copies in `npm ls` | 5.3.0 and 4.17.1 | 5.3.0 only |

## Client architecture

React 19 with React Router 8 and TanStack Query 5 (TypeScript, Vite). Source is in `client/src`.

- **Providers, outside in** (`App.tsx`): `QueryClientProvider` > `BrowserRouter` > `AuthState` > `Routes`.
  Query is outermost so the router and auth can use it; auth sits inside the router because its actions navigate.
- **Routes:** one layout route (`AppShell`: navigation, `main`, footer, toasts) holds every page.
  `RequireAuth` wraps `/create-post` and `/edit-post/:id` and redirects a visitor to `/login` once the session
  check has finished. An unknown URL keeps the shell with an empty `main` (a `*` route that renders nothing).
- **Auth context** (`context/authContext`): `AuthState` reads the session with `useMe` and exposes
  `loggedInUser`, `authLoading` and the actions (`login`, `logout`, `register`, `forgotPassword`, ...) through
  `AuthContext`; components read it with `useAuth()`, which throws outside the provider. The value is memoised, so a parent re-render does not re-render consumers. A visitor is
  `null` (a 401 from `/api/user/me` is a normal answer, not an error). Logout clears the whole query cache.
- **Folders:** `components/` (by feature), `hooks/` (one query or mutation each), `lib/` (`api`, `queryKeys`,
  `queryClient`, `postCache`, `formatDate`), `utils/` (image and URL helpers), `testing/` (`mockApi`, `testAuth`, `fixtures`, `dom`,
  `renderWithProviders`).
- **Router version:** React Router 8.4 (needs React >= 19.2.7). The move went 5 to 7 on React 18, then React 19,
  then router 8, because router 5 uses legacy context that React 19 removed. Imports come from `react-router`.
- **Devtools:** in `npm run dev` the TanStack Query devtools button sits in the bottom corner. It is not part
  of the production build. Set `VITE_QUERY_DEVTOOLS=false` to hide it (Playwright does, so it stays out of the way).

## Client data layer

- **`lib/api.ts`:** a small `fetch` wrapper (`api.get/post/put/delete`) that always sends cookies. A plain object
  goes out as JSON; a `FormData` goes out untouched with no `Content-Type`, so the browser adds the multipart
  boundary. Every failure becomes an `ApiError { status, message }` (status `0` for a network failure; the
  message is the server's `message` or `msg`). Aborts pass through as `AbortError`. `api.get<T>()` and friends take the response type from the caller; the one cast sits at the end of `request()` because the shapes are pinned by the contract tests and a runtime check would pull zod into the bundle.
- **Query keys** (`lib/queryKeys.ts`, `as const` tuples): the only place keys are written. They nest, e.g.
  `['posts', 'list', params]` and `['posts', 'detail', id]`, so invalidating `posts.all` hits every post query.
- **Query client** (`lib/queryClient.ts`): 30 s stale time, no refetch on window focus, one retry only for
  network and 5xx errors.
- **Hooks:** reads are `useMe`, `usePost`, `usePosts`, `usePostsInfinite`, `useUser`, `useUsers`,
  `useUserPosts`; writes are `useCreatePost`, `useEditPost`, `useDeletePost`, `useToggleLike`, `useAddComment`,
  `useDeleteComment`, `useUpdateProfile`, `useUpdateSocials`. Failed reads show the server message in a toast
  (`useErrorToast`), as the old contexts did.
- **Cache patching** (`lib/postCache.ts`): a like changes a post that can sit in the feed pages, the post page
  and a profile list at once. `useToggleLike` snapshots those caches, flips the heart at once in all of them,
  replaces the guess with the server's answer, and restores the snapshot on failure. Only that card changes.
- **Pagination:** the feed and the users page use `useInfiniteQuery` with `limit=12` and the API's `nextCursor`.
  `LoadMore` shows a "Load more" button while there is a next page, disables it while the page loads and
  removes it when `nextCursor` is `null`. Most popular posts keep one unpaginated list because they sort the whole set.
- **Dates:** `lib/formatDate.ts` prints `DD/MM/YYYY` with `Intl` (en-GB); `moment` is gone.

## Styling
Sass partials in `client/src/styles`, one entry (`main.scss`, imported once from `App.tsx`). Atomic design, BEM names, one class per selector.
- **Folders, in `@use` order:** `settings/` (`_tokens`, `_breakpoints`), `tools/` (`_mixins`), `generic/` (reset and bare elements, the only place for type selectors), `objects/` (layout helpers), `atoms/` (button, input, label, radio, tag, avatar, loader), `molecules/` (form-group, form-links, file-upload, card-interaction, load-more, comment-post), `organisms/` (card, user-card, header, nav, footer, form, comment ...), `pages/` (feed, post, account ...), `vendor/` (react-toastify override).
- **Levels:** a component carries the block class of its own level only. A parent never styles a child's internals; it passes a modifier (`<PostCard variant="account">` gives `card card--account`) or adds a layout mix class (`card__action button`).
- **BEM:** `block__element--modifier`, lowercase, dash-separated words. Write `.card__title`, never `.card div:first-child`.
- **Two allowed order dependences:** a mix class from a higher layer beats an atom at equal specificity (the layer order in `main.scss` decides), and a modifier sits right after its base and that base's `respond-to` blocks in the same partial.
- **Stylelint** (`stylelint.config.mjs`, standard-scss plus): max 1 class, 0 ids, 0 types, 0 combinators, 0 attributes per selector (pseudo-classes and pseudo-elements are fine), no `!important`, no descending specificity, nesting depth 1 (`&__el`, `&--mod`, `&:hover`, `@include`), BEM class pattern, no vendor prefixes. `generic/` may use type selectors, combinators and attributes. `vendor/` skips the class pattern. No allowlist and no disable comments.
- **Tokens:** `settings/_tokens.scss` holds Sass variables (colours, spacing, radii, shadows, gradients, font sizes and weights, durations) and emits them as CSS custom properties on `:root`. Use a token instead of a literal.
- **Breakpoints:** all max-width: `xxl` 1400, `xl` 1200, `lg` 991, `md` 767, `sm-wide` 590, `sm` 580, `xs` 500 px (590 and 580 are different on purpose). Write `@include respond-to('lg') { ... }` inside the block, widest first so the narrower query wins.
- **Add a component's styles:** pick the level, create `_name.scss` in that folder, `@use '../tools/mixins'` and `'../settings/tokens'` as needed, write `.name`, `.name__el` and `.name--mod` with one class each, add `@use 'level/name';` to `main.scss` in the right place, then put the classes in the component.
- **Accessibility mixins and tokens:** `focus-ring` (a 2px outline, applied through `:focus-visible` in `generic/_base.scss` to links, buttons, inputs and textareas, with a light variant in the dark header), `visually-hidden` (text for screen readers only) and `reduced-motion` (wraps styles in `prefers-reduced-motion: reduce`; the loader uses it). The ring colours are the tokens `focus` and `focus-inverse`.
- **Contrast:** `client/src/styles/contrast.test.ts` compiles the tokens and asserts the WCAG ratios of the colour pairs the app uses, so a token edit that breaks contrast fails `npm run test:client`.
- **Fonts:** Lato is self-hosted with `@fontsource/lato` (only the 300, 300 italic and 700 faces, the same as the old Google Fonts link), so the CSP allows no third-party font or style hosts.
- **Check:** `npm run lint:styles` (also part of `npm run lint` and `npm run check`).

## Tooling notes

- **ESLint peers:** `eslint-plugin-react` 7.37 and `eslint-plugin-jsx-a11y` 6.10 do not list ESLint 10 as a
  peer yet, though they work with it. The root `package.json` `overrides` point their `eslint` peer at the
  root version (`$eslint`) so `npm install` needs no `--legacy-peer-deps`. JSON has no comments, so the
  reason is written here. Remove the overrides once both plugins publish ESLint 10 peers.
- **React version in ESLint:** `eslint.config.mjs` pins `settings.react.version` instead of `'detect'`.
  `'detect'` still crashes with ESLint 10 (`context.getFilename is not a function` in `eslint-plugin-react`).
  Retry `'detect'` after upgrading that plugin.
- **ESLint peers, rechecked (npm registry, 2026-10-17):** `eslint-plugin-react` 7.37.5 is the latest release
  and its `eslint` peer stops at `^9.7`; `eslint-plugin-jsx-a11y` 6.10.2 stops at `^9`;
  `eslint-plugin-react-hooks` 7.1.1 already lists `^10`. Removing the `overrides` makes `npm install` fail
  with `ERESOLVE` and `'detect'` still crashes, so both stay (tried by execution, not assumed).
- **Client TypeScript projects:** `client/tsconfig.json` is a solution file that references three projects, all
  extending `tsconfig.base.json`: `tsconfig.app.json` (app code, only `vite/client` types), `tsconfig.test.json`
  (tests and `src/testing`, plus the Vitest globals because `test.globals` is on) and `tsconfig.node.json`
  (`vite.config.ts`). The root `tsc -b` builds them all. Every strict flag of the base applies, including
  `exactOptionalPropertyTypes`: it needed no library workaround.
- **Client lint:** `client/**/*.ts(x)` get `strictTypeChecked` + `stylisticTypeChecked` like the server, plus
  the React, hooks and a11y rules. Two relaxations apply to client tests only (see `eslint.config.mjs`):
  `no-confusing-void-expression` allows arrow shorthands (`waitFor(() => expect(...))`) and `require-await`
  is off (async fetch stubs).
- **TypeScript 7:** not adopted. Checked 2026-10-17: `typescript` latest is 7.0.2, but the latest
  `typescript-eslint` (8.71.2) declares the peer `typescript >=4.8.4 <6.1.0`, so the type-aware lint cannot
  run on 7. TypeScript stays pinned to 6.0.3.

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
client/           React 19 app (Vite, TypeScript)
shared/           @mern-blog/shared: zod schemas, DTO types, constants
  dist/             compiled package the server and client load (generated, gitignored)
e2e/              Playwright smoke specs (CommonJS JavaScript) and support files
.github/workflows/ci.yml   light CI: build, lint, typecheck and unit/API tests
scripts/          setup.mts
tsconfig.base.json shared compiler options
tsconfig.json     solution file for `npm run typecheck`
```

## Accessibility

- **Keyboard and focus:** every interactive element shows a visible focus ring for keyboard users
  (`:focus-visible`, at least 3:1 against the page). The like heart is a real button with `aria-pressed`
  (its label is "Like <post title>" in both states); Log out is a button; the hidden radio and file inputs
  draw their ring on the visible label.
- **Forms:** every input, textarea and radio group has a label (the comment box has a visually hidden one,
  the post tag radios are a `radiogroup` named "Post Tag"). Tests assert it for the main forms.
- **Images:** post images use the post title as alt text; avatars beside a visible name have empty alt; an
  avatar on its own reads "<name>'s avatar"; icon-only social links have an `aria-label`.
- **Contrast:** text and UI colours meet WCAG AA (4.5:1 for text, 3:1 for large text and UI parts), locked in
  by `contrast.test.ts`. Known exception: white headings and names on the green banner gradients
  (1.8 to 2.6:1). They are large display text, and fixing them would darken every banner.
- **Motion:** the loader animation stops under `prefers-reduced-motion`.
- **Not covered:** an axe-core pass over the main routes reports no serious or critical violations, but
  automated checks find only part of the problems and do not prove WCAG compliance. A manual keyboard and
  screen-reader pass is still recommended. Remaining moderate findings: two unlabelled `nav` landmarks, a
  nested `main` on the account page, heading levels that skip, and no `h1` on some pages.

## CI

`.github/workflows/ci.yml` runs on pushes to `master` and on pull requests: `npm ci`, `npm run build`,
`npm run lint`, `npm run typecheck`, `npm run test:api`, `npm run test:api:mongo` and
`npm run test:client` on Node 24 (read from `.nvmrc`). It has no secrets and does not deploy. Playwright is
deliberately not in CI; run the smoke suite locally with `npm run e2e:install` once, then `npm run test:e2e`.
Dependency updates are manual (`npm outdated`); Dependabot and Renovate are not set up.

## Roadmap

Phases 0 to 9 are done: safety net, security fixes, ESM and Express 5, file storage, TypeScript on the
server, Vite, React 19 with Router and Query, the BEM and atomic styles, and accessibility with CI. Deferred:
the moderate axe findings above, a manual screen-reader pass, and the create-post form's always-checked
"general" radio (kept as it was).
