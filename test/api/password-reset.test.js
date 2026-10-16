import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { clearDb, connectDb, disconnectDb, mongoose } from './support/db.js';
import { fakeConfig, fakeUser, loadApp, registerAndActivate } from './support/helpers.js';
import { extractLink, readLatestMail, tokenFromLink } from './support/outbox.js';

describe('forgot and reset password', () => {
  let app;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(clearDb);
  afterAll(disconnectDb);

  async function requestReset(user) {
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

  it('a reset link works once; the second use finds no user', async () => {
    const user = fakeUser();
    await registerAndActivate(app, user);
    const { token } = await requestReset(user);
    const body = { resetPasswordLink: token, newPassword: 'another-secret-1' };

    const first = await supertest(app).put('/api/auth/reset-password').send(body);
    const second = await supertest(app).put('/api/auth/reset-password').send(body);

    expect(first.status).toBe(200);
    expect(second.status).toBe(400);
    expect(second.body.message).toBe('User not found');
  });

  it('KNOWN BUG B4: the schema declares resetPasswordLink as a nested object, yet the flow works', async () => {
    const User = mongoose.model('user');
    // `{ data: String, default: '' }` is a nested path, not a String with a default.
    expect(User.schema.pathType('resetPasswordLink')).toBe('nested');
    expect(User.schema.pathType('resetPasswordLink.data')).toBe('real');

    const user = fakeUser();
    await registerAndActivate(app, user);
    const { token } = await requestReset(user);

    // Mongoose still writes the raw string at that path, which is why reset works at all.
    const raw = await mongoose.connection.db.collection('users').findOne({ email: user.email });
    expect(raw.resetPasswordLink).toBe(token);

    // ...and it is cleared to '' after a successful reset.
    await supertest(app)
      .put('/api/auth/reset-password')
      .send({ resetPasswordLink: token, newPassword: 'another-secret-1' });
    const after = await mongoose.connection.db.collection('users').findOne({ email: user.email });
    expect(after.resetPasswordLink).toBe('');
  });

  it('answers 400 for an unknown email', async () => {
    const res = await supertest(app)
      .put('/api/auth/forgot-password')
      .send({ email: 'ghost@example.test' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('User does not exist');
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

  it('KNOWN BUG B3: an invalid reset token returns a 500 with the raw JWT error', async () => {
    const res = await supertest(app)
      .put('/api/auth/reset-password')
      .send({ resetPasswordLink: 'not-a-jwt', newPassword: 'another-secret-1' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('jwt malformed');
  });
});
