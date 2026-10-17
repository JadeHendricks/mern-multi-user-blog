import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { clearDb, connectDb, disconnectDb, mongoose } from './support/db.js';
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

    it('answers a duplicate email with the same 200 and does not change the account', async () => {
      const user = fakeUser();
      await registerAndActivate(app, user);

      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ ...user, password: 'someone-elses-pw' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        `Email has been sent to ${user.email}. Follow the instructions to activate your account`,
      );
      expect(readLatestMail(user.email).subject).toBe('You already have an account');
      const login = await supertest(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });
      expect(login.status).toBe(200);
    });

    it('the activation mail has a random token link, no password and no JWT', async () => {
      const user = fakeUser();
      await supertest(app).post('/api/auth/register').send(user);

      const mail = readLatestMail(user.email);
      const token = tokenFromLink(extractLink(mail));
      expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
      expect(mail.html.includes(user.password)).toBe(false);
      expect(/eyJ/.test(mail.html)).toBe(false);

      // Only the hash is stored, and the password is a bcrypt hash.
      const raw = await mongoose.connection.db.collection('users').findOne({ email: user.email });
      expect(raw.status).toBe('pending');
      expect(raw.activationToken === token).toBe(false);
      expect(/^[0-9a-f]{64}$/.test(raw.activationToken)).toBe(true);
      expect(raw.password.startsWith('$2')).toBe(true);
    });

    it('registering again while pending refreshes the link and the old link stops working', async () => {
      const user = fakeUser();
      await supertest(app).post('/api/auth/register').send(user);
      const first = tokenFromLink(extractLink(readLatestMail(user.email)));
      const again = await supertest(app).post('/api/auth/register').send(user);
      const second = tokenFromLink(extractLink(readLatestMail(user.email)));

      expect(again.status).toBe(200);
      expect(second === first).toBe(false);
      const old = await supertest(app).post('/api/auth/account-activation').send({ token: first });
      expect(old.status).toBe(401);
      const fresh = await supertest(app).post('/api/auth/account-activation').send({ token: second });
      expect(fresh.status).toBe(201);
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

    it('using the activation link twice is a 409, not an expired link', async () => {
      const user = fakeUser();
      await supertest(app).post('/api/auth/register').send(user);
      const token = tokenFromLink(extractLink(readLatestMail(user.email)));

      const first = await supertest(app).post('/api/auth/account-activation').send({ token });
      const second = await supertest(app).post('/api/auth/account-activation').send({ token });

      expect(first.status).toBe(201);
      expect(second.status).toBe(409);
      expect(second.body.message).toBe('Account is already activated');
    });

    it('rejects an expired activation link and keeps the user pending', async () => {
      const user = fakeUser();
      await supertest(app).post('/api/auth/register').send(user);
      const token = tokenFromLink(extractLink(readLatestMail(user.email)));
      await mongoose.connection.db
        .collection('users')
        .updateOne({ email: user.email }, { $set: { activationExpires: new Date(Date.now() - 1000) } });

      const res = await supertest(app).post('/api/auth/account-activation').send({ token });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Expired Link. Signup again');
      const preview = await supertest(app).get(`/api/auth/account-activation/${token}`);
      expect(preview.status).toBe(404);
    });

    it('a pending user cannot log in', async () => {
      const user = fakeUser();
      await supertest(app).post('/api/auth/register').send(user);

      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Incorrect email or password');
    });

    it('the preview endpoint returns the name for a valid link and 404 for junk', async () => {
      const user = fakeUser();
      await supertest(app).post('/api/auth/register').send(user);
      const token = tokenFromLink(extractLink(readLatestMail(user.email)));

      const ok = await supertest(app).get(`/api/auth/account-activation/${token}`);
      expect(ok.status).toBe(200);
      expect(ok.body).toEqual({ name: user.name });
      const junk = await supertest(app).get('/api/auth/account-activation/not-a-token');
      expect(junk.status).toBe(404);
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
      expect('token' in res.body).toBe(false);
      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user.name).toBe(user.name);
      expect('password' in res.body.user).toBe(false);

      const cookie = res.headers['set-cookie'].find((c) => c.startsWith('authtoken='));
      expect(cookie).toBeDefined();
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Lax/i);
      // NODE_ENV is not production in tests, so the Secure flag is absent.
      expect(cookie).not.toMatch(/Secure/i);
    });

    it('the session JWT and cookie both last COOKIE_EXPIRES_IN days', async () => {
      const user = fakeUser();
      await registerAndActivate(app, user);
      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });

      const cookie = res.headers['set-cookie'].find((c) => c.startsWith('authtoken='));
      const token = cookie.split(';')[0].slice('authtoken='.length);
      const { exp, iat } = jwt.decode(token);
      expect(exp - iat).toBe(Number(fakeConfig().COOKIE_EXPIRES_IN) * 86400);
      const expires = new Date(/Expires=([^;]+)/i.exec(cookie)[1]).getTime();
      expect(Math.abs(expires - (exp * 1000))).toBeLessThan(5000);
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

    it('accepts the session cookie value as a Bearer header too', async () => {
      const user = fakeUser();
      await registerAndActivate(app, user);
      const login = await supertest(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });
      const token = login.headers['set-cookie']
        .find((c) => c.startsWith('authtoken='))
        .split(';')[0]
        .slice('authtoken='.length);

      const me = await supertest(app)
        .get('/api/user/me')
        .set('Authorization', `Bearer ${token}`);

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

    it('POST logout clears the cookie and ends the session', async () => {
      const { agent } = await createUserAndLogin(app);

      const res = await agent.post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('success');
      expect(res.headers.deprecation).toBeUndefined();
      const cookie = res.headers['set-cookie'].find((c) => c.startsWith('authtoken='));
      expect(cookie.startsWith('authtoken=;')).toBe(true);
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Lax/i);

      const after = await agent.get('/api/auth/isloggedin');
      expect(after.status).toBe(401);
    });

    it('GET logout still works as a deprecated alias', async () => {
      const { agent } = await createUserAndLogin(app);

      const res = await agent.get('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.headers.deprecation).toBe('true');
      const cookie = res.headers['set-cookie'].find((c) => c.startsWith('authtoken='));
      expect(cookie.startsWith('authtoken=;')).toBe(true);
      expect((await agent.get('/api/auth/isloggedin')).status).toBe(401);
    });
    it('a second login gives a fresh working session', async () => {
      const { credentials } = await createUserAndLogin(app);

      const { agent } = await login(app, credentials);

      expect((await agent.get('/api/auth/isloggedin')).status).toBe(200);
    });
  });
});
