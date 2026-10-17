import { spawn } from 'node:child_process';
import type { ChildProcessByStdio } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { connectDb, disconnectDb, getStoreDir, getStoreMongoUri, newId } from './support/db.js';
import { createUserAndLogin, fakeConfig, LONG_DESCRIPTION, loadApp } from './support/helpers.js';

const crashServer = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'support',
  'crash-server.ts',
);

// The crash-server child plus a promise for its exit, which afterEach awaits.
type CrashServer = ChildProcessByStdio<null, Readable, Readable> & {
  exited: Promise<{ code: number | null; signal: NodeJS.Signals | null }>;
};
let child: CrashServer | undefined;

// Starts support/crash-server.ts with the same fake config as this worker.
function startServer(extraEnv: Record<string, string | undefined> = {}): Promise<number> {
  return new Promise((resolve, reject) => {
    // `--import tsx`: the child imports server sources that are TypeScript, which plain node
    // cannot resolve from `.js` specifiers.
    const spawned = spawn(process.execPath, ['--import', 'tsx', crashServer], {
      env: { ...process.env, ...extraEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child = Object.assign(spawned, {
      exited: new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((done) =>
        spawned.once('exit', (code, signal) => {
          done({ code, signal });
        }),
      ),
    });
    // Child output is not forwarded: it can contain stack traces and request details.
    spawned.stderr.resume();
    let buffer = '';
    const timer = setTimeout(() => {
      reject(new Error('crash server did not start'));
    }, 15000);
    spawned.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const match = /PORT=(\d+)/.exec(buffer);
      if (match) {
        clearTimeout(timer);
        resolve(Number(match[1]));
      }
    });
    spawned.once('exit', () => {
      clearTimeout(timer);
    });
  });
}

// Resolves { status } when the server answers, or { error } when it hangs up without a response.
function request(
  port: number,
  method: string,
  urlPath: string,
  headers: http.OutgoingHttpHeaders = {},
  body?: string,
): Promise<{ status?: number | undefined; error?: string }> {
  return new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port, method, path: urlPath, headers }, (res) => {
      res.resume();
      res.on('end', () => {
        resolve({ status: res.statusCode });
      });
    });
    req.on('error', (err: NodeJS.ErrnoException) => {
      resolve({ error: err.code ?? err.message });
    });
    req.setTimeout(10000, () => {
      req.destroy(new Error('timeout'));
    });
    if (body) req.write(body);
    req.end();
  });
}

afterEach(async () => {
  if (child?.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  if (child) await child.exited;
  child = undefined;
});

describe('protect with an invalid token', () => {
  it('answers 401 for a garbage Bearer token and the server stays alive', async () => {
    const port = await startServer();

    const result = await request(port, 'GET', '/api/user/me', {
      Authorization: 'Bearer not-a-jwt',
    });

    expect(result.status).toBe(401);
    expect(child?.exitCode).toBeNull();
    expect((await request(port, 'GET', '/api/nope')).status).toBe(404);
  });

  it('answers 401 for an expired Bearer token and the server stays alive', async () => {
    const port = await startServer();
    const expired = jwt.sign({ _id: newId() }, fakeConfig().JWT_SECRET, {
      expiresIn: -60,
    });

    const result = await request(port, 'GET', '/api/user/me', {
      Authorization: `Bearer ${expired}`,
    });

    expect(result.status).toBe(401);
    expect(child?.exitCode).toBeNull();
    expect((await request(port, 'GET', '/api/nope')).status).toBe(404);
  });

  it('answers 401 for a garbage authtoken cookie and the server stays alive', async () => {
    const port = await startServer();

    const result = await request(port, 'GET', '/api/user/me', { Cookie: 'authtoken=garbage' });

    expect(result.status).toBe(401);
    expect(child?.exitCode).toBeNull();
    expect((await request(port, 'GET', '/api/nope')).status).toBe(404);
  });
});

describe('isloggedin with a bad cookie (try/catch path)', () => {
  const app = loadApp();

  it('answers 401 for a garbage cookie', async () => {
    const res = await supertest(app).get('/api/auth/isloggedin').set('Cookie', 'authtoken=garbage');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token is no longer valid, please log in again.');
  });

  it('answers 401 for an expired cookie', async () => {
    const expired = jwt.sign({ _id: newId() }, fakeConfig().JWT_SECRET, {
      expiresIn: -60,
    });

    const res = await supertest(app)
      .get('/api/auth/isloggedin')
      .set('Cookie', `authtoken=${expired}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token is no longer valid, please log in again.');
  });
});

describe('API fallbacks', () => {
  const app = loadApp();

  it('answers an unknown /api route with a JSON 404', async () => {
    const res = await supertest(app).get('/api/nope');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({ message: 'Not found' });
  });

  it('answers a malformed JSON body with a JSON 400', async () => {
    const res = await supertest(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.message).toBeDefined();
  });
});

describe('editPost with an unknown post id', () => {
  beforeAll(connectDb);
  afterAll(disconnectDb);

  it('editing an unknown post id answers 404 and the server stays alive', async () => {
    const app = loadApp();
    const { user } = await createUserAndLogin(app);
    const token = jwt.sign({ _id: user._id }, fakeConfig().JWT_SECRET, { expiresIn: 600 });
    // Same data folder as this worker, so the child finds the user that protect looks up.
    const port = await startServer({
      CRASH_SERVER_DATA_DIR: getStoreDir(),
      CRASH_SERVER_MONGO_URI: getStoreMongoUri(),
    });
    const body = JSON.stringify({
      id: newId(),
      title: 'Ghost',
      description: LONG_DESCRIPTION,
    });

    const result = await request(
      port,
      'PUT',
      `/api/post/${newId()}`,
      {
        Cookie: `authtoken=${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      body,
    );

    expect(result.status).toBe(404);
    // The handler used to send 200 after the 404 and kill the process; Express 5 now contains it.
    expect(child?.exitCode).toBeNull();
  });
});
