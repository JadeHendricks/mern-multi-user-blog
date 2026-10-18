import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { clearDb, connectDb, disconnectDb } from './support/db.js';
import {
  createPost,
  createUserAndLogin,
  LONG_DESCRIPTION,
  loadApp,
} from './support/helpers.js';

// These replace the removed sanitizer middleware (xss-clean, express-mongo-sanitize, hpp) and cover
// the Express 5 behaviour changes. They run on both drivers like the rest of test/api.
describe('express 5 behaviour', () => {
  let app;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(clearDb);
  afterAll(disconnectDb);

  describe('NoSQL operator payloads', () => {
    it('login with operator objects is rejected with a 4xx', async () => {
      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: { $ne: null }, password: 'x' });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('login with an operator in the password is rejected with a 4xx', async () => {
      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 'someone@example.test', password: { $ne: null } });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('an operator object as the reset token answers 4xx', async () => {
      const res = await supertest(app)
        .put('/api/auth/reset-password')
        .send({ resetPasswordLink: { $gt: '' }, newPassword: 'a-new-password' });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('an operator object as the activation token answers 4xx', async () => {
      const res = await supertest(app)
        .post('/api/auth/account-activation')
        .send({ token: { $gt: '' } });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('an operator object as the forgot-password email answers 4xx', async () => {
      const res = await supertest(app)
        .put('/api/auth/forgot-password')
        .send({ email: { $ne: null } });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('empty bodies', () => {
    it.each([
      ['POST', '/api/auth/register'],
      ['POST', '/api/auth/account-activation'],
      ['POST', '/api/auth/login'],
      ['PUT', '/api/auth/forgot-password'],
      ['PUT', '/api/auth/reset-password'],
    ])('%s %s without a body does not answer 500', async (method, url) => {
      const res = await supertest(app)[method.toLowerCase()](url);
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('authenticated writes without a body do not answer 500', async () => {
      const { agent } = await createUserAndLogin(app);
      const me = await agent.put('/api/user/me');
      expect(me.status).toBe(422);
      const socials = await agent.put('/api/user/me/socials');
      expect(socials.status).toBeLessThan(500);
      const post = await agent.post('/api/post');
      expect(post.status).toBe(422);
    });
  });

  describe('error handling', () => {
    it('answers malformed JSON with a JSON 4xx', async () => {
      const res = await supertest(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": ');
      expect(res.status).toBe(400);
      expect(res.type).toBe('application/json');
    });

    it('answers an unexpected async throw with a generic 500 and keeps serving', async () => {
      const failing = {
        users: {
          findByEmail: async () => {
            throw new Error('secret internal detail');
          },
        },
        posts: {},
        admin: {},
      };
      const broken = createApp({ store: failing });
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const res = await supertest(broken)
        .post('/api/auth/login')
        .send({ email: 'someone@example.test', password: 'password-1' });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Something went wrong' });
      expect(JSON.stringify(res.body)).not.toContain('secret');
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();

      // The same app instance still answers
      const next = await supertest(broken).get('/api/nope');
      expect(next.status).toBe(404);
    });
  });

  describe('text is stored and returned as typed', () => {
    it('keeps markup in a post title untouched (React escapes on output)', async () => {
      const { agent } = await createUserAndLogin(app);
      const title = '<script>alert("x")</script> & more';
      const post = await createPost(agent, { title, description: LONG_DESCRIPTION });
      expect(post.title).toBe(title);
      const fetched = await supertest(app).get(`/api/post/${post._id}`);
      expect(fetched.body.post.title).toBe(title);
    });
  });
});
