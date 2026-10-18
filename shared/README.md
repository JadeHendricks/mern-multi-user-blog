# @mern-blog/shared

Constants, request-body schemas and response types used by the API (`server/`) and, from Phase 6, the client.
One definition per thing: types are inferred from zod schemas, never written twice.

| File                | What it holds                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/constants.ts`  | Limits and defaults (`NAME_MAX`, `PASSWORD_MIN`, `MAX_IMAGE_BYTES`, `IMAGE_MIME_TYPES`, ...)           |
| `src/requests.ts`   | Request-body schemas with the exact messages the API has always sent, plus `*Request` types            |
| `src/dto.ts`        | Response schemas and the `*Dto` / `*Response` types inferred from them (dates are ISO strings)         |

## How it is consumed

It is a compiled package: `npm run build -w shared` runs `tsc` and writes `dist/` (JavaScript, `.d.ts`
and declaration maps, ES2020). `main`, `types` and `exports` all point at `dist`.

- Why `dist` and not `.ts` source: Node ESM cannot load TypeScript from `node_modules`, so the server and the
  production client build read the compiled package. `main` points at `dist` too. The client's Vite dev
  server and Vitest alias the package to `src/index.ts` instead (see `client/vite.config.ts`).
- The server's Vitest config aliases `@mern-blog/shared` to `shared/src/index.ts`, so tests never run
  against a stale build.
- `shared/dist` is generated and gitignored. The root scripts build it before anything that loads the
  package outside Vitest (`predev`, `prelint`, `pretest:api`, `build:api`). While you work, `npm run dev`
  runs `tsc --watch` on it (`npm run watch -w shared`); the API's `tsx watch` restarts when `dist` changes.
- `tsc -b` at the repo root (`npm run typecheck`) builds this package first because `server/` lists it
  as a project reference.

```ts
import { registerRequestSchema, type PostDto, NAME_MAX } from '@mern-blog/shared';
```

## Request schemas behave like the old express-validator chains

They are not a plain `z.object`. They were written to give the same answer as the chains they replace:
a missing field is checked as `''`, numbers and booleans as their string form, arrays element by
element (an empty array passes), "not empty" does not trim, and the first broken rule of the first
failing field is the message. `test/legacy-cases.ts` holds about 550 bodies recorded from the old
chains with the message each one produced; `test/requests.test.ts` replays them. Do not edit the
recorded expectations to make a test pass: a difference there is an API change.

A valid body is returned unchanged (same keys and values, extra keys kept), so its field values are
`unknown`. The `*Request` types describe what a well-behaved client sends.

## Scripts

```bash
npm run build -w shared       # tsc -> shared/dist
npm run watch -w shared       # tsc --watch (part of `npm run dev`)
npm run typecheck -w shared   # src and test
npm run test -w shared        # Vitest (also part of `npm run test:api`)
```
