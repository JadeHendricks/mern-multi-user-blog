import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { clearDb, connectDb, disconnectDb } from './support/db.js';
import {
  createUserAndLogin,
  fakeConfig,
  fakeUser,
  loadApp,
  login,
  registerAndActivate,
} from './support/helpers.js';
import { extractLink, readLatestMail, readMails, tokenFromLink } from './support/outbox.js';

describe('auth', () => {
  let app;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(clearDb);
  afterAll(disconnectDb);

  describe('register and activate', () => {
    it('sends an activation mail and creates the account only after activation', async () => {
      const user = fakeUser();

      const register = await supertest(app).post('/api/auth/register').send(user);
      expect(register.status).toBe(200);
      expect(register.body.message).toContain(user.email);

      const mail = readLatestMail(user.email);
      expect(mail.to).toBe(user.email);
      expect(mail.subject).toBe('Account activation link');
      expect(mail.from).toBe(fakeConfig().EMAIL_FROM);
      const link = extractLink(mail);
      expect(link.startsWith(`${fakeConfig().CLIENT_URL}/auth/activate/`)).toBe(true);

      // Not an account yet: login must fail until the link is used.
      const early = await supertest(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });
      expect(early.status).toBe(401);

      const activation = await supertest(app)
        .post('/api/auth/account-activation')
        .send({ token: tokenFromLink(link) });
      expect(activation.status).toBe(201);
      expect(activation.body.message).toBe('Activation successful. Please login.');
    });

    it('rejects a duplicate email once the account exists', async () => {
      const user = fakeUser();
      await registerAndActivate(app, user);

      const res = await supertest(app).post('/api/auth/register').send(user);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email Address already exists');
    });

    it('validates the register payload', async () => {
      const mailsBefore = readMails().length;
      const missingName = await supertest(app)
        .post('/api/auth/register')
        .send({ email: 'a@example.test', password: 'secret-123' });
      expect(missingName.status).toBe(422);
      expect(missingName.body.message).toBe('Name is required');

      const badEmail = await supertest(app)
        .post('/api/auth/register')
        .send({ name: 'A', email: 'nope', password: 'secret-123' });
      expect(badEmail.status).toBe(422);
      expect(badEmail.body.message).toBe('Must be a valid email address');

      const shortPassword = await supertest(app)
        .post('/api/auth/register')
        .send({ name: 'A', email: 'a@example.test', password: '123' });
      expect(shortPassword.status).toBe(422);
      expect(shortPassword.body.message).toBe('Password must be atleast 6 characters long');

      expect(readMails()).toHaveLength(mailsBefore);
    });

    it('requires a token to activate', async () => {
      const res = await supertest(app).post('/api/auth/account-activation').send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('No token associated to this account');
    });

    it('answers 401 for an invalid activation token', async () => {
      const res = await supertest(app)
        .post('/api/auth/account-activation')
        .send({ token: 'not-a-jwt' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Expired Link. Signup again');
    });

    it('KNOWN BUG B11: using the activation link twice is reported as an expired link', async () => {
      const user = fakeUser();
      await supertest(app).post('/api/auth/register').send(user);
      const token = tokenFromLink(extractLink(readLatestMail(user.email)));

      const first = await supertest(app).post('/api/auth/account-activation').send({ token });
      const second = await supertest(app).post('/api/auth/account-activation').send({ token });

      expect(first.status).toBe(201);
      // The duplicate key error is swallowed by the catch-all and looks like an expired link.
      expect(second.status).toBe(401);
      expect(second.body.message).toBe('Expired Link. Signup again');
    });
  });

  describe('login, isloggedin, me, logout', () => {
    it('logs in, sets an httpOnly authtoken cookie and never returns the password', async () => {
      const user = fakeUser();
      await registerAndActivate(app, user);

      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });

      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user.name).toBe(user.name);
      expect('password' in res.body.user).toBe(false);

      const cookie = res.headers['set-cookie'].find((c) => c.startsWith('authtoken='));
      expect(cookie).toBeDefined();
      expect(cookie).toMatch(/HttpOnly/i);
      // NODE_ENV is not production in tests, so the Secure flag is absent.
      expect(cookie).not.toMatch(/Secure/i);
    });

    it('walks register -> activate -> login -> isloggedin -> /api/user/me', async () => {
      const { agent, credentials } = await createUserAndLogin(app);

      const loggedIn = await agent.get('/api/auth/isloggedin');
      expect(loggedIn.status).toBe(200);
      expect(loggedIn.body.message).toBe('success');

      const me = await agent.get('/api/user/me');
      expect(me.status).toBe(200);
      expect(me.body.message).toBe('success');
      expect(me.body.user.email).toBe(credentials.email);
    });

    it('accepts the login token as a Bearer header too', async () => {
      const user = fakeUser();
      await registerAndActivate(app, user);
      const { body } = await supertest(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });

      const me = await supertest(app)
        .get('/api/user/me')
        .set('Authorization', `Bearer ${body.token}`);

      expect(me.status).toBe(200);
      expect(me.body.user.email).toBe(user.email);
    });

    it('rejects a wrong password and an unknown email with the same 401', async () => {
      const user = fakeUser();
      await registerAndActivate(app, user);

      const wrongPassword = await supertest(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'definitely-wrong' });
      const unknownEmail = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.test', password: user.password });

      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      expect(wrongPassword.body.message).toBe('Incorrect email or password');
      expect(unknownEmail.body.message).toBe('Incorrect email or password');
    });

    it('validates the login payload', async () => {
      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: '123' });

      expect(res.status).toBe(422);
      expect(res.body.message).toBe('Invalid Credentials');
    });

    it('answers 401 on isloggedin and on protected routes without a token', async () => {
      const loggedIn = await supertest(app).get('/api/auth/isloggedin');
      expect(loggedIn.status).toBe(401);
      expect(loggedIn.body.message).toBe('You are not logged in, please login to view this page.');

      const me = await supertest(app).get('/api/user/me');
      expect(me.status).toBe(401);
      expect(me.body.message).toBe('You are not logged in! Please log in to get access.');
    });

    it('logout overwrites the cookie with "loggedout"', async () => {
      const { agent } = await createUserAndLogin(app);

      const res = await agent.get('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('success');
      const cookie = res.headers['set-cookie'].find((c) => c.startsWith('authtoken='));
      expect(cookie.startsWith('authtoken=loggedout')).toBe(true);
      expect(cookie).toMatch(/HttpOnly/i);

      const after = await agent.get('/api/auth/isloggedin');
      expect(after.status).toBe(401);
    });

    it('a second login gives a fresh working session', async () => {
      const { credentials } = await createUserAndLogin(app);

      const { agent } = await login(app, credentials);

      expect((await agent.get('/api/auth/isloggedin')).status).toBe(200);
    });
  });
});
