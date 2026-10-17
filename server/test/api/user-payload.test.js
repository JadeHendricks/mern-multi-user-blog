import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { clearDb, connectDb, disconnectDb } from './support/db.js';
import { createPost, createUserAndLogin, loadApp } from './support/helpers.js';
import { extractLink, readLatestMail, tokenFromLink } from './support/outbox.js';

// These tests pin KEY NAMES only, never values. Tokens, hashes and emails are not printed:
// anything sensitive is compared inside the test and only a boolean reaches the assertion.
const keysOf = (object) => Object.keys(object).sort();

describe('public user payloads expose only the public fields', () => {
  let app;
  let alice;
  let bob;
  let post;
  let resetToken;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(async () => {
    await clearDb();
    alice = await createUserAndLogin(app);
    bob = await createUserAndLogin(app);
    post = await createPost(alice.agent, { title: 'Public post' });
    await supertest(app).put('/api/auth/forgot-password').send({ email: alice.credentials.email });
    resetToken = tokenFromLink(extractLink(readLatestMail(alice.credentials.email)));
  });
  afterAll(disconnectDb);

  const publicKeys = ['_id', 'avatar', 'createdAt', 'name'];
  const ownerKeys = ['_id', 'avatar', 'createdAt', 'email', 'name', 'role', 'status', 'updatedAt'];

  it('GET /api/user (no login) lists only public keys, even for a user with a pending reset', async () => {
    const res = await supertest(app).get('/api/user');

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(2);
    for (const user of res.body.users) {
      for (const key of publicKeys) expect(keysOf(user)).toContain(key);
      for (const key of keysOf(user)) expect([...publicKeys, 'socials']).toContain(key);
    }
  });

  it('GET /api/user/:id (no login) returns only public keys', async () => {
    const res = await supertest(app).get(`/api/user/${bob.user._id}`);

    expect(res.status).toBe(200);
    for (const key of keysOf(res.body.user)) expect([...publicKeys, 'socials']).toContain(key);
    for (const key of ['email', 'role', 'updatedAt', '__v', 'password', 'resetPasswordLink']) {
      expect(key in res.body.user).toBe(false);
    }
  });

  it('no secret field reaches /api/user or /api/user/:id, and a made-up token resets nothing', async () => {
    const one = await supertest(app).get(`/api/user/${alice.user._id}`);
    const all = await supertest(app).get('/api/user');
    const fromList = all.body.users.find((user) => user._id === alice.user._id);

    expect('resetPasswordLink' in one.body.user).toBe(false);
    expect('resetPasswordLink' in fromList).toBe(false);
    // Booleans only, so the token never shows up in a failure message.
    expect(JSON.stringify(all.body).includes(resetToken)).toBe(false);

    const reset = await supertest(app)
      .put('/api/auth/reset-password')
      .send({ resetPasswordLink: 'made-up-token', newPassword: 'whatever-password-1' });
    expect(reset.status).toBeGreaterThanOrEqual(400);
  });

  it('GET /api/post shows the author name, avatar and id only', async () => {
    const res = await supertest(app).get('/api/post');

    expect(res.status).toBe(200);
    expect(keysOf(res.body.posts[0].user)).toEqual(['_id', 'avatar', 'name']);
  });

  it('GET /api/post/:id shows the author without email (socials only when set)', async () => {
    const res = await supertest(app).get(`/api/post/${post._id}`);

    expect(res.status).toBe(200);
    const keys = keysOf(res.body.post.user);
    for (const key of ['_id', 'avatar', 'name']) expect(keys).toContain(key);
    for (const key of ['email', 'password', 'resetPasswordLink', 'role'])
      expect(keys).not.toContain(key);
  });

  it('GET /api/post/user/:id shows the author without email', async () => {
    const res = await supertest(app).get(`/api/post/user/${alice.user._id}`);

    expect(res.status).toBe(200);
    expect(keysOf(res.body.posts[0].user)).toEqual(['_id', 'avatar', 'name']);
  });

  it('login and /api/user/me return the owner view without the password hash or secrets', async () => {
    const me = await alice.agent.get('/api/user/me');

    expect(me.status).toBe(200);
    expect(keysOf(me.body.user)).toEqual(ownerKeys);
    expect(keysOf(alice.user)).toEqual(ownerKeys);
  });
});
