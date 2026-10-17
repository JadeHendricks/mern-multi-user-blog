# E2E smoke tests

`npm run test:e2e` runs Playwright (Chromium) against the real client and API. It is a small
behaviour smoke suite: it proves the app boots, serves the seeded data, logs in and out, guards
private routes and serves the production build. There are no screenshot/visual tests (the visual
baseline suite was removed once the styling refactor was done).

## What runs

Playwright starts three servers itself (`webServer` in `playwright.config.js`), then runs the specs:

- API on `http://localhost:5000`: `e2e/support/start-api.js` creates a JSON-file store in a temp
  folder, seeds it through the repositories and serves the real Express app. Mail and uploads go to
  temp folders, so nothing leaves the machine. It loads the compiled server
  (`server/dist/src/...` and `server/dist/scripts/seed.js`), so it stays CommonJS like the rest of
  `e2e/` and needs no tsx. `npm run test:e2e` builds `shared/` and `server/` and the client first
  (`pretest:e2e`); if you run `npx playwright test` directly, run `npm run build` yourself after a
  change.
- A second API instance on `http://localhost:5001` that serves the built client in `client/dist`
  (`E2E_SERVE_CLIENT=1 E2E_PORT=5001`), used by the `prod-smoke` project.
- Client on exactly `http://localhost:3000`: the Vite dev server (`npm run dev -w client`), used by
  the `desktop` project. The port is fixed (`strictPort`) and the Vite proxy forwards `/api` and
  `/uploads` to port 5000.

Ports 3000, 5000 and 5001 must be free. `npm run test:e2e` checks that first
(`e2e/support/check-ports.js`) and stops with the port and how to find its owner; it never kills
anything. The servers are never reused (`reuseExistingServer: false`), so every run starts from the
same seed and a fresh rate limiter.

`e2e/global-setup.js` logs the seeded owner (Alice) and visitor (Bob) in over the API and saves
their cookies to `e2e/.auth/*.json` (ignored by git).

## Specs

- `smoke.spec.js` (desktop project, dev server): seeded titles on the home page, login and logout
  through the UI, the logged-out `/create-post` redirect to `/login`, logged-out public pages stay
  put, profile social links (https only), and uploaded images/avatars loading from `/uploads` with
  the default-image fallback.
- `prod-smoke.spec.js` (`prod-smoke` project, built client on `:5001`, no screenshots): home feed,
  a post page, login through the UI, and Load more with a route fixture. It also asserts the page
  loaded the hashed `/assets/*.js` bundle and nothing from the Vite dev server.

No spec writes to the database (logins only set a cookie), so the data is identical at the start of
every run.

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
