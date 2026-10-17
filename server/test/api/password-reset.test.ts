import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import supertest from 'supertest';
import { clearDb, connectDb, disconnectDb, getStore, rawUser } from './support/db.js';
import {
  createUserAndLogin,
  fakeConfig,
  fakeUser,
  loadApp,
  registerAndActivate,
} from './support/helpers.js';
import { extractLink, readLatestMail, readMails, tokenFromLink } from './support/outbox.js';

describe('forgot and reset password', () => {
  let app: Express;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(clearDb);
  afterAll(disconnectDb);

  async function requestReset(user: { email: string }) {
    const res = await supertest(app).put('/api/auth/forgot-password').send({ email: user.email });
    return { res, token: tokenFromLink(extractLink(readLatestMail(user.email))) };
  }

  it('forgot -> reset -> login works with the new password only', async () => {
    const user = fakeUser();
    await registerAndActivate(app, user);

    const { res, token } = await requestReset(user);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain(user.email);

    const mail = readLatestMail(user.email);
    expect(mail.subject).toBe('Password Reset link');
    expect(extractLink(mail).startsWith(`${fakeConfig().CLIENT_URL}/auth/password/reset/`)).toBe(
      true,
    );

    const newPassword = `new-${fakeUser().password}`;
    const reset = await supertest(app)
      .put('/api/auth/reset-password')
      .send({ resetPasswordLink: token, newPassword });
    expect(reset.status).toBe(200);
    expect(reset.body.message).toBe('Password has been updated, Login!');

    const withNew = await supertest(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: newPassword });
    expect(withNew.status).toBe(200);

    const withOld = await supertest(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    expect(withOld.status).toBe(401);
  });

  it('a reset link works once; the second use is an invalid link', async () => {
    const user = fakeUser();
    await registerAndActivate(app, user);
    const { token } = await requestReset(user);
    const body = { resetPasswordLink: token, newPassword: 'another-secret-1' };

    const first = await supertest(app).put('/api/auth/reset-password').send(body);
    const second = await supertest(app).put('/api/auth/reset-password').send(body);

    expect(first.status).toBe(200);
    expect(second.status).toBe(400);
    expect(second.body.message).toBe('Invalid or expired reset link');
  });

  it('stores only a SHA-256 hash of the link and unsets it after a reset', async () => {
    const user = fakeUser();
    await registerAndActivate(app, user);
    const { token } = await requestReset(user);

    // Secrets are only returned when asked for, so no ordinary read can leak the hash.
    const plain = await getStore().users.findByEmail(user.email);
    if (!plain) throw new Error('user not found');
    for (const key of ['resetHash', 'resetExpires', 'passwordHash'])
      expect(key in plain).toBe(false);

    const raw = await rawUser(user.email);
    expect(raw.resetHash === token).toBe(false);
    expect(/^[0-9a-f]{64}$/.test(raw.resetHash ?? '')).toBe(true);
    const minutes = ((raw.resetExpires?.getTime() ?? Number.NaN) - Date.now()) / 60000;
    expect(minutes).toBeGreaterThan(28);
    expect(minutes).toBeLessThanOrEqual(30);

    await supertest(app)
      .put('/api/auth/reset-password')
      .send({ resetPasswordLink: token, newPassword: 'another-secret-1' });
    const after = await rawUser(user.email);
    expect('resetHash' in after).toBe(false);
    expect('resetExpires' in after).toBe(false);
    expect(after.passwordChangedAt instanceof Date).toBe(true);
  });

  it('rejects an expired reset link with 400', async () => {
    const user = fakeUser();
    await registerAndActivate(app, user);
    const { token } = await requestReset(user);
    const stored = await rawUser(user.email);
    await getStore().admin.patchUser(stored._id, { resetExpires: new Date(Date.now() - 1000) });

    const res = await supertest(app)
      .put('/api/auth/reset-password')
      .send({ resetPasswordLink: token, newPassword: 'another-secret-1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid or expired reset link');
  });

  it('a session issued before the reset is rejected afterwards', async () => {
    const { agent, credentials } = await createUserAndLogin(app);
    expect((await agent.get('/api/user/me')).status).toBe(200);
    // JWT iat has one-second resolution, so let the clock tick past the login second.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const { token } = await requestReset(credentials);
    await supertest(app)
      .put('/api/auth/reset-password')
      .send({ resetPasswordLink: token, newPassword: 'another-secret-1' });

    expect((await agent.get('/api/user/me')).status).toBe(401);
    expect((await agent.get('/api/auth/isloggedin')).status).toBe(401);
    const fresh = await supertest(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'another-secret-1' });
    expect(fresh.status).toBe(200);
  });
  it('answers an unknown email with the same 200 and sends no mail', async () => {
    const email = 'ghost@example.test';
    const res = await supertest(app).put('/api/auth/forgot-password').send({ email });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(
      `Email has been sent to ${email}. Follow the instructions to reset your password`,
    );
    expect(readMails(email)).toHaveLength(0);
  });
  it('validates the forgot and reset payloads', async () => {
    const forgot = await supertest(app).put('/api/auth/forgot-password').send({ email: 'nope' });
    expect(forgot.status).toBe(422);
    expect(forgot.body.message).toBe('Must be a valid email address');

    const reset = await supertest(app)
      .put('/api/auth/reset-password')
      .send({ resetPasswordLink: 'x', newPassword: '123' });
    expect(reset.status).toBe(422);
    expect(reset.body.message).toBe('Password must be atleast 6 characters long');
  });

  it('an invalid reset token returns 400 without leaking a JWT error', async () => {
    const res = await supertest(app)
      .put('/api/auth/reset-password')
      .send({ resetPasswordLink: 'not-a-token', newPassword: 'another-secret-1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid or expired reset link');
  });

  it('requires the reset link in the payload', async () => {
    const res = await supertest(app)
      .put('/api/auth/reset-password')
      .send({ newPassword: 'another-secret-1' });

    expect(res.status).toBe(422);
  });
});
