import { randomBytes } from 'node:crypto';
import supertest from 'supertest';
import { createApp } from '../../../src/app.js';
import { getStore } from './db.js';
import { extractLink, readLatestMail, tokenFromLink } from './outbox.js';

// The store is looked up on every call, so an app created at describe time (before connectDb runs)
// still talks to the store of the test file that is running.
const currentStore = {
  get users() {
    return getStore().users;
  },
  get posts() {
    return getStore().posts;
  },
  get admin() {
    return getStore().admin;
  },
};

export function loadApp(options = {}) {
  return createApp({ store: currentStore, ...options });
}

// The settings tests need (e.g. to sign tokens), read from the env that support/env.js set up.
// Never print these.
export function fakeConfig() {
  const { CLIENT_URL, EMAIL_FROM, JWT_SECRET, COOKIE_EXPIRES_IN } = process.env;
  return { CLIENT_URL, EMAIL_FROM, JWT_SECRET, COOKIE_EXPIRES_IN };
}

export function fakeUser(overrides = {}) {
  const id = randomBytes(4).toString('hex');
  return {
    name: `Tester ${id}`,
    email: `tester-${id}@example.test`,
    password: `pw-${randomBytes(6).toString('hex')}`,
    ...overrides,
  };
}

export async function registerAndActivate(app, user) {
  const register = await supertest(app).post('/api/auth/register').send(user);
  if (register.status !== 200) throw new Error(`register failed with ${register.status}`);

  const token = tokenFromLink(extractLink(readLatestMail(user.email)));
  const activation = await supertest(app).post('/api/auth/account-activation').send({ token });
  if (activation.status !== 201) throw new Error(`activation failed with ${activation.status}`);
}

// Returns a supertest agent that carries the authtoken cookie, plus the login payload's user.
export async function login(app, user) {
  const agent = supertest.agent(app);
  const res = await agent
    .post('/api/auth/login')
    .send({ email: user.email, password: user.password });
  if (res.status !== 200) throw new Error(`login failed with ${res.status}`);
  return { agent, user: res.body.user };
}

export async function createUserAndLogin(app, overrides) {
  const user = fakeUser(overrides);
  await registerAndActivate(app, user);
  const session = await login(app, user);
  return { ...session, credentials: user };
}

export const LONG_DESCRIPTION =
  'This description is long enough to satisfy the fifty character minimum of the validator.';

export async function createPost(agent, fields = {}) {
  const res = await agent.post('/api/post').send({
    title: 'A test post',
    tag: 'testing',
    description: LONG_DESCRIPTION,
    ...fields,
  });
  if (res.status !== 201) throw new Error(`create post failed with ${res.status}`);
  return res.body.post;
}

// Smallest valid PNG (1x1 pixel), used for multipart uploads.
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
