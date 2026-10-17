# Mern Multi User Blog

A blog written in the mern stack that handles:
```bash
1 - multi users 
2 - register, login, logout, forgot password recovery, reset password 
3 - create a post, delete a post, update a post
4 - like posts, unlike posts
5 - add comments to posts
```

## Installation
```bash
1 - npm install (once, at the repo root: installs the server, client and shared workspaces)
2 - add a .env file to the root and add in your process.env.NODE_ENV (dev || prod)
3 - add a server/config/default.json file and add in your config for the application
4 - npm run dev (API on :5000 and client on :3000 together)
```

## Testing
Needs Node 24 (see `.nvmrc`). None of the tests need a real database, real config or any network
service: they use an in-memory MongoDB, fake config values and a file-based mail outbox.
```bash
npm run e2e:install    # once: downloads the Chromium build Playwright uses
npm run check          # lint + API tests + client tests + E2E (what to run before a commit)
```
Individual commands:
```bash
npm run lint             # eslint (server, test, e2e, scripts; client/ keeps its own CRA lint)
npm run test:api         # Vitest + supertest against the Express app (see server/test/README.md)
npm run test:client      # react-scripts test; the client has no tests yet, so it passes with none
npm run test:e2e         # Playwright: screenshots, smoke flows, informational axe report
npm run test:e2e:update  # re-record the screenshot baselines (only for intended visual changes)
npm run serve:memory     # API on :5000 with seeded in-memory data, to click around by hand
```
- Mail never leaves the machine in tests: with `MAIL_TRANSPORT=file` each email is written as a
  JSON file to the outbox folder (`tmp/outbox` by default) and the tests read links from there.
- Screenshot baselines live in `e2e/__screenshots__`. They are compared with zero pixel tolerance, so
  any visual change fails the run until you review it and run `npm run test:e2e:update`. They were
  rendered on Windows and need regenerating when CI moves to Linux. More in `e2e/README.md`.
- Ports 3000 and 5000 must be free while the E2E tests run.
- Tests that start with `KNOWN BUG` record behaviour that is wrong today; they are flipped when the
  bug is fixed.

## Tools
express, mongoose, javascript, reactjs, node, concurrently, nodemon, html, css
