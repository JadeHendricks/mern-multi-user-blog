# E2E tests and screenshot baselines

`npm run test:e2e` runs Playwright (Chromium) against the real client and API. It records how the
app looks and behaves today so later phases can prove they changed nothing by accident.

## What runs

Playwright starts two servers itself (`webServer` in `playwright.config.js`), then runs the specs:

- API on `http://localhost:5000`: `e2e/support/start-api.js` starts an in-memory MongoDB
  (`mongodb-memory-server`), seeds it with `scripts/seed.js` and serves the real Express app.
  Mail goes to a temp folder and uploads to a temp folder, so nothing leaves the machine.
- Client on exactly `http://localhost:3000`: the CRA dev server. The port is fixed because
  `AuthState.js` hard-codes that origin in its public-route list (known bug B14). The CRA proxy
  forwards `/api` to port 5000.

Ports 3000 and 5000 must be free. The servers are never reused (`reuseExistingServer: false`), so
every run starts from the same seed and a fresh rate limiter.

`e2e/global-setup.js` logs the seeded owner (Alice) and visitor (Bob) in over the API and saves
their cookies to `e2e/.auth/*.json` (ignored by git).

## Specs

- `visual.spec.js`: full-page screenshots of every route at 375, 768 and 1280 px, plus header
  variants, hover and focus states and one toast.
- `smoke.spec.js` (desktop only): seeded titles on the home page, login and logout through the UI,
  and the logged-out `/create-post` behaviour (known bug B15).
- `a11y.spec.js` (desktop only): runs axe on every route, attaches the JSON result to the report and
  logs counts by impact. It is informational and never fails the run.

No spec submits a form that changes data, so the database is identical at the start of every run.
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
npm run serve:memory      # API on 5000 with seeded in-memory data (nothing is saved)
npm run start:client      # in a second terminal: http://localhost:3000
```

All four seeded users share the throwaway E2E password defined in `scripts/seed.js`
(`alice@example.test`, `bob@example.test`, `carol@example.test`, `dan@example.test`).

## First run

`npm run e2e:install` downloads the Chromium build Playwright needs. The first API start downloads
a MongoDB binary once (cached in `node_modules/.cache/mongodb-memory-server`).
