import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { clearDb, connectDb, disconnectDb } from './support/db.js';
import { createPost, createUserAndLogin, loadApp } from './support/helpers.js';
import { extractLink, readLatestMail, tokenFromLink } from './support/outbox.js';

// These tests pin KEY NAMES only, never values. Tokens, hashes and emails are not printed:
// anything sensitive is compared inside the test and only a boolean reaches the assertion.
const keysOf = (object) => Object.keys(object).sort();

describe('KNOWN BUG S4/B4: public endpoints expose whole user documents', () => {
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

  // The resetPasswordLink key only exists on a user document after forgot-password was called for it.
  const plainUserKeys = ['__v', '_id', 'avatar', 'createdAt', 'email', 'name', 'role', 'updatedAt'];
  const resetUserKeys = [...plainUserKeys, 'resetPasswordLink'].sort();

  it('KNOWN BUG S4: GET /api/user (no login) returns every account with email and role', async () => {
    const res = await supertest(app).get('/api/user');

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(2);
    const byId = Object.fromEntries(res.body.users.map((user) => [user._id, user]));
    expect(keysOf(byId[alice.user._id])).toEqual(resetUserKeys);
    expect(keysOf(byId[bob.user._id])).toEqual(plainUserKeys);
    for (const user of res.body.users) expect('password' in user).toBe(false);
  });

  it('KNOWN BUG S4: GET /api/user/:id (no login) returns email, role and timestamps', async () => {
    const res = await supertest(app).get(`/api/user/${bob.user._id}`);

    expect(res.status).toBe(200);
    expect(keysOf(res.body.user)).toEqual(plainUserKeys);
    expect('password' in res.body.user).toBe(false);
  });

  it('KNOWN BUG S4/B4: anyone can read a pending password-reset token from /api/user and /api/user/:id', async () => {
    const one = await supertest(app).get(`/api/user/${alice.user._id}`);
    const all = await supertest(app).get('/api/user');
    const fromList = all.body.users.find((user) => user._id === alice.user._id);

    // Booleans only, so the token never shows up in a failure message.
    expect(one.body.user.resetPasswordLink === resetToken).toBe(true);
    expect(fromList.resetPasswordLink === resetToken).toBe(true);
    // Someone who never requested a reset has no such key at all.
    const bobs = await supertest(app).get(`/api/user/${bob.user._id}`);
    expect('resetPasswordLink' in bobs.body.user).toBe(false);
  });

  it('KNOWN BUG S4: the exposed reset token is enough to take over the account', async () => {
    const one = await supertest(app).get(`/api/user/${alice.user._id}`);
    const stolen = one.body.user.resetPasswordLink;
    const newPassword = `stolen-${alice.credentials.password}`;

    const reset = await supertest(app)
      .put('/api/auth/reset-password')
      .send({ resetPasswordLink: stolen, newPassword });
    const login = await supertest(app)
      .post('/api/auth/login')
      .send({ email: alice.credentials.email, password: newPassword });

    expect(reset.status).toBe(200);
    expect(login.status).toBe(200);
  });

  it('KNOWN BUG S4: GET /api/post exposes the author email next to name, avatar and id', async () => {
    const res = await supertest(app).get('/api/post');

    expect(res.status).toBe(200);
    expect(keysOf(res.body.posts[0].user)).toEqual(['_id', 'avatar', 'email', 'name']);
    expect('password' in res.body.posts[0].user).toBe(false);
    expect('resetPasswordLink' in res.body.posts[0].user).toBe(false);
  });

  it('KNOWN BUG S4: GET /api/post/:id exposes the author email (and socials when set)', async () => {
    const res = await supertest(app).get(`/api/post/${post._id}`);

    expect(res.status).toBe(200);
    const keys = keysOf(res.body.post.user);
    for (const key of ['_id', 'avatar', 'email', 'name']) expect(keys).toContain(key);
    expect(keys).not.toContain('password');
    expect(keys).not.toContain('resetPasswordLink');
    expect(keys).not.toContain('role');
  });

  it('KNOWN BUG S4: GET /api/post/user/:id exposes the author email too', async () => {
    const res = await supertest(app).get(`/api/post/user/${alice.user._id}`);

    expect(res.status).toBe(200);
    expect(keysOf(res.body.posts[0].user)).toEqual(['_id', 'avatar', 'email', 'name']);
  });

  it('login and /api/user/me return the owner document without the password hash', async () => {
    const me = await alice.agent.get('/api/user/me');

    expect(me.status).toBe(200);
    expect(keysOf(me.body.user)).toEqual(resetUserKeys);
    // The login payload was captured before the reset request, so it has no reset key yet.
    expect(keysOf(alice.user)).toEqual(plainUserKeys);
    expect('password' in me.body.user).toBe(false);
  });
});
