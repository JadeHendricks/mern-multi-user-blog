import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import supertest from 'supertest';
import { clearDb, connectDb, disconnectDb } from './support/db.js';
import { fakeUser, loadApp } from './support/helpers.js';

describe('auth rate limiter', () => {
  let app: Express;
  const original = process.env.AUTH_RATE_LIMIT_MAX;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(clearDb);
  afterEach(() => {
    process.env.AUTH_RATE_LIMIT_MAX = original;
  });
  afterAll(disconnectDb);

  it('answers the 4th login with a JSON 429 when the cap is 3', async () => {
    process.env.AUTH_RATE_LIMIT_MAX = '3';
    const credentials = { email: 'nobody@example.test', password: 'wrong-password' };

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const res = await supertest(app).post('/api/auth/login').send(credentials);
      expect(res.status).toBe(401);
    }
    const blocked = await supertest(app).post('/api/auth/login').send(credentials);

    expect(blocked.status).toBe(429);
    expect(blocked.headers['content-type']).toMatch(/json/);
    expect(typeof blocked.body.message).toBe('string');
  });

  it('counts each endpoint separately', async () => {
    process.env.AUTH_RATE_LIMIT_MAX = '1';
    const user = fakeUser();

    const register = await supertest(app).post('/api/auth/register').send(user);
    const forgot = await supertest(app)
      .put('/api/auth/forgot-password')
      .send({ email: user.email });
    const registerAgain = await supertest(app).post('/api/auth/register').send(user);

    expect(register.status).toBe(200);
    expect(forgot.status).toBe(200);
    expect(registerAgain.status).toBe(429);
  });

  it('is not limited at the test default', async () => {
    const credentials = { email: 'nobody@example.test', password: 'wrong-password' };
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const res = await supertest(app).post('/api/auth/login').send(credentials);
      expect(res.status).toBe(401);
    }
  });
});
