import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { stubStore } from './support/helpers.js';
// Tests run with NODE_ENV=test, so client serving is switched on explicitly with a temp "dist" folder.
describe('serving the built client', () => {
  let dir: string;
  let app: ReturnType<typeof createApp>;
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'client-dist-'));
    fs.mkdirSync(path.join(dir, 'assets'));
    fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>spa</title>');
    fs.writeFileSync(path.join(dir, 'assets', 'x.js'), 'console.log(1);');
    app = createApp({ store: stubStore(), clientDir: dir, serveClient: true });
  });
  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('serves index.html for / without caching it', async () => {
    const res = await supertest(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<title>spa</title>');
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('serves index.html for an unknown SPA route', async () => {
    const res = await supertest(app).get('/some/spa/route');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<title>spa</title>');
  });

  it('serves hashed assets with a long immutable cache', async () => {
    const res = await supertest(app).get('/assets/x.js');
    expect(res.status).toBe(200);
    expect(res.text).toBe('console.log(1);');
    expect(res.headers['cache-control']).toContain('immutable');
  });

  it('keeps a missing asset a 404 instead of returning HTML', async () => {
    const res = await supertest(app).get('/assets/missing.js');
    expect(res.status).toBe(404);
  });

  it('answers unknown /api and /uploads paths with JSON 404', async () => {
    const api = await supertest(app).get('/api/nope');
    expect(api.status).toBe(404);
    expect(api.body).toEqual({ message: 'Not found' });
    const upload = await supertest(app).get('/uploads/nope.jpg');
    expect(upload.status).toBe(404);
    expect(upload.body).toEqual({ message: 'Not found' });
  });
});
