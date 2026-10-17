# E2E tests and screenshot baselines

`npm run test:e2e` runs Playwright (Chromium) against the real client and API. It records how the
app looks and behaves today so later phases can prove they changed nothing by accident.

## What runs

Playwright starts three servers itself (a second API instance is described under the specs) (`webServer` in `playwright.config.js`), then runs the specs:

- API on `http://localhost:5000`: `e2e/support/start-api.js` creates a JSON-file store in a temp
  folder, seeds it through the repositories and serves the real Express app.
  Mail goes to a temp folder and uploads to a temp folder, so nothing leaves the machine.
  It loads the compiled server (`server/dist/src/...` and `server/dist/scripts/seed.js`) with
  `import()` and file URLs, so it stays CommonJS like the rest of `e2e/` and needs no tsx.
  `npm run test:e2e` and `npm run serve:memory` build `shared/` and `server/` first
  (`npm run build:api`); if you run `npx playwright test` directly, run `npm run build:api`
  yourself after a server change.
- Client on exactly `http://localhost:3000`: the Vite dev server (`npm run dev -w client`). The port is fixed
  (`strictPort`) because `AuthState.jsx` hard-codes that origin in its public-route list (known bug B14).
  The Vite proxy forwards `/api` and `/uploads` to port 5000.

Ports 3000, 5000 and 5001 (the production-build instance, see `prod-smoke.spec.js`) must be free. The servers are never reused (`reuseExistingServer: false`), so
every run starts from the same seed and a fresh rate limiter.

`e2e/global-setup.js` logs the seeded owner (Alice) and visitor (Bob) in over the API and saves
their cookies to `e2e/.auth/*.json` (ignored by git).

## Specs

- `visual.spec.js`: full-page screenshots of every route at 375, 768 and 1280 px, plus header
  variants, hover and focus states and one toast.
- `smoke.spec.js` (desktop only): seeded titles on the home page, login and logout through the UI,
  and the logged-out `/create-post` behaviour (known bug B15).
- `load-more.spec.js`: the "Load more" button on Home and Users. Two screenshots per project use the
  real API answer with a `nextCursor` added by `page.route`; one desktop-only test creates 8 posts
  through the API, pages through them and deletes them again, so later specs see the seeded 6.
  Create its baselines with `npx playwright test e2e/load-more.spec.js --update-snapshots=missing`
  (`npm run test:e2e:update -- <file>` passes the file to the wrong option).
- `prod-smoke.spec.js` (own `prod-smoke` project, no screenshots): the built client in `client/dist`, served by a
  second API instance on `http://localhost:5001` (`E2E_SERVE_CLIENT=1 E2E_PORT=5001 node e2e/support/start-api.js`,
  its own seeded temp store). It checks the home feed, a post page, login through the UI and Load more with a
  route fixture, and asserts the page loaded the hashed `/assets/*.js` bundle and nothing from the Vite dev
  server. `npm run test:e2e` builds the client first (`pretest:e2e`); the other projects ignore this spec.
- `a11y.spec.js` (desktop only): runs axe on every route, attaches the JSON result to the report and
  logs counts by impact. It is informational and never fails the run.

Only the desktop load-more test writes data, and it deletes it again, so the database is identical at the start of every run.
Failed logins and logins are the only writes (a cookie, no database change).

## Determinism

The clock is frozen at 2026-01-15T10:00:00Z (`page.clock.setFixedTime`), the browser time zone is
UTC, animations are disabled, the caret is hidden, requests to Google Fonts (and every other
non-local host) are aborted so the fallback font is always used, and each screenshot waits for the
network to go idle, the loader to disappear, images to decode and `document.fonts.ready`.
`maxDiffPixels` is 0: a single changed pixel fails the test.

## Baselines

Baselines live in `e2e/__screenshots__/<project>/<spec file>/<name>.png`. There is no platform
suffix on purpose, so the names stay stable across phases.

They were rendered with Chromium on Windows. Text rendering differs between operating systems, so
when CI runs on Linux (Phase 9) the baselines have to be regenerated there and committed again.

Update them only when a visual change is intended:

```powershell
npm run test:e2e:update
```

Review the changed PNGs before committing them.

## Try the seeded app by hand

```powershell
npm run serve:memory      # API on 5000 with seeded throwaway data (nothing outlives the run)
npm run dev:web           # in a second terminal: http://localhost:3000
```

All four seeded users share the throwaway E2E password defined in `server/scripts/seed-data.cjs`
(`alice@example.test`, `bob@example.test`, `carol@example.test`, `dan@example.test`).

## First run

`npm run e2e:install` downloads the Chromium build Playwright needs. The first API start downloads
a MongoDB binary once (cached in `node_modules/.cache/mongodb-memory-server`).
