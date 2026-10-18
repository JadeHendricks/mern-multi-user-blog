# MERN Multi-User Blog

A multi-user blogging app built on the MERN stack. Readers browse posts; registered users write,
edit and illustrate their own posts, like and comment on others, and manage a personal profile.

The app runs on your own machine with **no database server required** — data is stored in plain JSON
files by default. MongoDB is optional and can be switched on later without any code changes. The API,
the shared types package and the React client are all written in TypeScript.

## Features

- **Accounts** — register, activate via an email link, log in and out. Sessions use an HTTP-only JWT cookie.
- **Password reset** — request a reset link by email and set a new password.
- **Posts** — create, edit and delete posts with an optional cover image and a tag.
- **Engagement** — like/unlike posts and add or remove comments.
- **Profiles** — edit your display details, avatar and social links; view any user's posts.
- **Feeds** — a paginated post feed and a users directory, plus a most-popular list.
- **Local-first storage** — JSON file store out of the box; MongoDB optional behind the same interface.
- **Email** — written to a local outbox folder in development, or sent via SendGrid in production.
- **Accessible UI** — keyboard focus states, labelled forms and controls, and AA colour contrast.

## Tech stack

| Layer | Technology |
| --- | --- |
| Client | React 19, React Router, TanStack Query, Vite, TypeScript |
| API | Node.js 24+, Express 5, TypeScript (ESM) |
| Storage | JSON file store (default) or MongoDB |
| Shared | `@mern-blog/shared` — zod schemas, DTO types and constants used by both sides |
| Email | Local file outbox (dev) or SendGrid (prod) |

## Prerequisites

- **Node.js 24 or newer** and **npm 11**. (A `.nvmrc` pins the version — run `nvm use` to pick it up.)
- Nothing else for everyday use. MongoDB is only needed if you choose `DB_DRIVER=mongo`.

## Quick start

From a fresh clone, three commands get you a running, populated blog:

```bash
npm install        # installs the server, client and shared workspaces (run once, at the repo root)
npm run seed       # fills the file store with demo users, posts, comments and images
npm run dev        # API on http://localhost:5000, client on http://localhost:3000
```

Then open **http://localhost:3000**.

- `npm run dev` runs the setup step for you first, writing a `.env` with a random `JWT_SECRET`, so you
  can start without any manual configuration.
- Seeded accounts share one throwaway password, `E2e-Throwaway-1!`, with emails `alice@example.test`,
  `bob@example.test`, `carol@example.test` and `dan@example.test`.
- To run the production build instead of the dev servers, use `npm start`.

### Demo data

`npm run seed` fills an empty store with four active users, a pending user, several posts with comments
and likes, and sample images. Re-seed from scratch with `npm run seed -- --reset` (stop `npm run dev`
first). The throwaway password is for demo data only and is not a secret. Don't seed a store you care about.

## Configuration (secrets and settings)

Settings come from environment variables in a `.env` file at the repo root. Running `npm run setup`
(also run automatically by `npm run dev`) creates `.env` from `.env.example` and fills in a random
`JWT_SECRET`. The file is never committed. Invalid values stop the server at startup with a message
that names the offending key (never its value).

**The only required secret is `JWT_SECRET`.** Everything else has a sensible default. To send real
email you also need the SendGrid keys.

| Variable | Required? | Default | What it's for |
| --- | --- | --- | --- |
| `JWT_SECRET` | **Yes** | none | Signs session cookies. At least 32 characters. `npm run setup` generates one. |
| `PORT` | No | `5000` | API port. |
| `CLIENT_URL` | No | `http://localhost:3000` | Browser origin: used in email links and CORS. |
| `DB_DRIVER` | No | `json` | `json` (files) or `mongo`. |
| `DATA_DIR` | No | `server/data` | Root for the JSON store, backups, uploads, outbox and exports. |
| `MONGO_URI` | Only if `DB_DRIVER=mongo` | none | MongoDB connection string. |
| `COOKIE_EXPIRES_IN` | No | `7` | Session length in days. |
| `MAIL_TRANSPORT` | No | `file` | `file` (writes to the outbox) or `sendgrid` (sends real mail). |
| `SG_API_KEY` | Only if `MAIL_TRANSPORT=sendgrid` | none | SendGrid API key. |
| `EMAIL_FROM` | Only if `MAIL_TRANSPORT=sendgrid` | local default | "From" address on outgoing mail. |
| `EMAIL_REPLY` | Only if `MAIL_TRANSPORT=sendgrid` | none | "Reply-To" address on outgoing mail. |
| `AUTH_RATE_LIMIT_MAX` | No | `10` | Attempts allowed per 15 minutes on each auth endpoint. |
| `BACKUP_KEEP` | No | `10` | Number of rolling JSON backups to keep. |
| `NODE_ENV` | No | `development` | `development`, `test` or `production`. |

### Email in development

With the default `MAIL_TRANSPORT=file`, nothing is sent. Each email is written as a JSON file in
`<DATA_DIR>/outbox/`. After registering or requesting a password reset, open the newest file in that
folder and copy the link from its `html` field into your browser.

To send real mail, set `MAIL_TRANSPORT=sendgrid` and provide `SG_API_KEY`, `EMAIL_FROM` and `EMAIL_REPLY`.

## Running and building

Run these from the repo root:

| Command | What it does |
| --- | --- |
| `npm install` | Install the server, client and shared workspaces. |
| `npm run setup` | Create `.env` with a random `JWT_SECRET` (never overwrites an existing `.env`). |
| `npm run dev` | Start the shared-types watcher, the API (port 5000) and the Vite client (port 3000) together. |
| `npm run build` | Compile the shared package and server, then build the client for production. |
| `npm start` | Build everything and start the compiled API. With `NODE_ENV=production` it also serves the built client. |
| `npm run seed [-- --reset]` | Fill the store with demo data (optionally wiping it first). |
| `npm test` | Run the API and client test suites. |
| `npm run check` | Lint, type-check and run all tests. Run this before committing. |

## Where your data lives

Everything is under `<DATA_DIR>` (default `server/data/`, gitignored, created on first start):

```text
server/data/
  db.json      users and posts (the JSON store)
  backups/     rolling copies of db.json
  uploads/     post images and avatars (served under /uploads)
  outbox/      emails the app "sent" in file mode
  exports/     files created by npm run db:export
```

Only one process can open the JSON store at a time. `npm run seed` and `db:import` refuse to run while
the dev server holds it — stop `npm run dev` first.

## Switching to MongoDB (optional)

The file store and the Mongo store implement the same interface, so the application code does not
change when you switch. To run against MongoDB locally:

```bash
docker run -d --name blog-mongo -p 27017:27017 mongo:8    # or use a local mongod
```

Then in `.env`:

```ini
DB_DRIVER=mongo
MONGO_URI=mongodb://127.0.0.1:27017/blog
```

Move existing data across with the export/import scripts (they work in both directions):

```bash
npm run db:export                                  # writes to server/data/exports/
npm run db:import -- <file.json> [--replace] [--driver json|mongo]
```

**Things to know before you migrate:**

- **Export files contain password hashes.** Treat them as sensitive; the default exports folder is gitignored.
- **`db:import` won't overwrite a non-empty store** unless you pass `--replace`.
- **Remote Mongo is blocked by default.** `seed` and `db:import` refuse any host that isn't local
  (`localhost`, `127.0.0.1`, `::1`) and every `mongodb+srv://` address. Pass `--allow-remote` to override.
  Connection strings are never printed to logs.
- **Uploaded images are plain files**, not stored in the database. Copy `<DATA_DIR>/uploads/` yourself
  when moving environments.
- **Switching back to JSON** is symmetric — set `DB_DRIVER=json` and import an export made from Mongo.

## Project layout

```text
server/   Express 5 API (TypeScript, ESM)
client/   React 19 app (Vite, TypeScript)
shared/   @mern-blog/shared: zod schemas, DTO types, constants shared by both sides
e2e/      Playwright smoke tests
scripts/  repo setup script
```

## License

ISC. See the repository for details.
