import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import supertest from 'supertest';
import { clearDb, connectDb, disconnectDb } from './support/db.js';
import { loadApp } from './support/helpers.js';

describe('harness', () => {
  let app: Express;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(clearDb);
  afterAll(disconnectDb);

  it('serves an empty post list from the in-memory database', async () => {
    const res = await supertest(app).get('/api/post');

    expect(res.status).toBe(200);
    expect(res.body.results).toBe(0);
    expect(res.body.posts).toEqual([]);
  });
});
