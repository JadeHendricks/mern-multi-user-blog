import { spawn } from 'node:child_process';
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll, describe, expect, inject, it } from 'vitest';
import supertest from 'supertest';
import { connectDb, disconnectDb, mongoose } from './support/db.js';
import { createUserAndLogin, fakeConfig, LONG_DESCRIPTION, loadApp } from './support/helpers.js';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');
const crashServer = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'support',
  'crash-server.js',
);

let child;

// Starts support/crash-server.js with the same fake config as this worker.
function startServer(extraEnv = {}) {
  return new Promise((resolve, reject) => {
    child = spawn(process.execPath, [crashServer], {
      env: { ...process.env, ...extraEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.exited = new Promise((done) =>
      child.once('exit', (code, signal) => done({ code, signal })),
    );
    // Child output is not forwarded: it can contain stack traces and request details.
    child.stderr.resume();
    let buffer = '';
    const timer = setTimeout(() => reject(new Error('crash server did not start')), 15000);
    child.stdout.on('data', (chunk) => {
      buffer += chunk;
      const match = /PORT=(\d+)/.exec(buffer);
      if (match) {
        clearTimeout(timer);
        resolve(Number(match[1]));
      }
    });
    child.once('exit', () => clearTimeout(timer));
  });
}

// Resolves { status } when the server answers, or { error } when it hangs up without a response.
function request(port, method, urlPath, headers = {}, body) {
  return new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port, method, path: urlPath, headers }, (res) => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode }));
    });
    req.on('error', (err) => resolve({ error: err.code || err.message }));
    req.setTimeout(10000, () => req.destroy(new Error('timeout')));
    if (body) req.write(body);
    req.end();
  });
}

async function expectCrash() {
  const timeout = new Promise((resolve) => setTimeout(() => resolve('still running'), 10000));
  const outcome = await Promise.race([child.exited, timeout]);
  expect(outcome).not.toBe('still running');
  expect(outcome.code).not.toBe(0);
  expect(outcome.code).not.toBeNull();
}

afterEach(async () => {
  if (child && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  if (child) await child.exited;
  child = undefined;
});

describe('protect with an invalid token', () => {
  it('KNOWN BUG B1: a garbage Bearer token gets no response and kills the server', async () => {
    const port = await startServer();

    const result = await request(port, 'GET', '/api/user/me', {
      Authorization: 'Bearer not-a-jwt',
    });

    expect(result.status).toBeUndefined();
    expect(result.error).toBeDefined();
    await expectCrash();
  });

  it('KNOWN BUG B1: an expired token gets no response and kills the server', async () => {
    const port = await startServer();
    const expired = jwt.sign(
      { _id: new mongoose.Types.ObjectId().toString() },
      fakeConfig().JWT_SECRET,
      {
        expiresIn: -60,
      },
    );

    const result = await request(port, 'GET', '/api/user/me', {
      Authorization: `Bearer ${expired}`,
    });

    expect(result.status).toBeUndefined();
    expect(result.error).toBeDefined();
    await expectCrash();
  });

  it('KNOWN BUG B1: a garbage authtoken cookie kills the server on a protected route', async () => {
    const port = await startServer();

    const result = await request(port, 'GET', '/api/user/me', { Cookie: 'authtoken=garbage' });

    expect(result.status).toBeUndefined();
    expect(result.error).toBeDefined();
    await expectCrash();
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
    const expired = jwt.sign(
      { _id: new mongoose.Types.ObjectId().toString() },
      fakeConfig().JWT_SECRET,
      {
        expiresIn: -60,
      },
    );

    const res = await supertest(app)
      .get('/api/auth/isloggedin')
      .set('Cookie', `authtoken=${expired}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token is no longer valid, please log in again.');
  });
});

describe('KNOWN BUG B2: editPost has no return after its 404', () => {
  beforeAll(connectDb);
  afterAll(disconnectDb);

  it('KNOWN BUG B2: editing an unknown post id answers 404, then the server crashes', async () => {
    const app = loadApp();
    const { user } = await createUserAndLogin(app);
    const token = jwt.sign({ _id: user._id }, fakeConfig().JWT_SECRET, { expiresIn: 600 });
    // Same database as this worker, so the child finds the user that protect looks up.
    const port = await startServer({
      CRASH_SERVER_MONGO_URI: `${inject('mongoUri')}${mongoose.connection.name}`,
    });
    const body = JSON.stringify({
      id: new mongoose.Types.ObjectId().toString(),
      title: 'Ghost',
      description: LONG_DESCRIPTION,
    });

    const result = await request(
      port,
      'PUT',
      `/api/post/${new mongoose.Types.ObjectId()}`,
      {
        Cookie: `authtoken=${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      body,
    );

    // The client sees the 404 that was sent first...
    expect(result.status).toBe(404);
    // ...then `res.status(200).json()` throws ERR_HTTP_HEADERS_SENT inside an async handler.
    await expectCrash();
  });
});
