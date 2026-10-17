import { randomBytes } from 'node:crypto';
import type { Express } from 'express';
import supertest from 'supertest';
import { z } from 'zod';
import type { LoginResponse, OwnUserDto, PostDto, PostResponse } from '@mern-blog/shared';
import { createApp } from '../../../src/app.js';
import type { Mailer } from '../../../src/lib/mailer.js';
import type { PostRepo, Store, StoreAdmin, UserRepo } from '../../../src/store/types.js';
import { getStore } from './db.js';
import { extractLink, readLatestMail, tokenFromLink } from './outbox.js';

// supertest types `res.body` as `any`: it is whatever the server sent. This is the ONE place that
// states what a body is expected to look like. The assertion is not checked at runtime, so tests
// still assert on the values; the type only keeps the shape flowing through helpers and callers.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- T names the expected body at the call site
export function bodyOf<T>(res: { body: unknown }): T {
  return res.body as T;
}

// superagent types every header as a string, but Node hands `set-cookie` over as an array.
export function setCookies(res: { headers: Record<string, string> }): string[] {
  return z.array(z.string()).parse(res.headers['set-cookie']);
}

// The Set-Cookie line of the session cookie; throws when the response did not set one.
export function authCookie(res: { headers: Record<string, string> }): string {
  const cookie = setCookies(res).find((c) => c.startsWith('authtoken='));
  if (cookie === undefined) throw new Error('The response did not set an authtoken cookie.');
  return cookie;
}

// The value of a Set-Cookie line ("authtoken=<value>; Path=/; ...").
export const tokenOfCookie = (cookie: string): string =>
  (cookie.split(';')[0] ?? '').slice('authtoken='.length);

// A store with only the parts a test fills in, for tests whose request never reaches the rest
// (a failing repo, the headers of a bare app). Calling a part that was not given fails with
// "is not a function".
export function stubStore(
  parts: { users?: Partial<UserRepo>; posts?: Partial<PostRepo>; admin?: Partial<StoreAdmin> } = {},
): Store {
  // Single assertion: the partial repos are intentionally not complete repos.
  return { users: {}, posts: {}, admin: {}, ...parts } as unknown as Store;
}

// What createUserAndLogin hands back.
export interface Session {
  agent: supertest.Agent;
  user: OwnUserDto;
  credentials: FakeUser;
}

// The store is looked up on every call, so an app created at describe time (before connectDb runs)
// still talks to the store of the test file that is running.
const currentStore: Store = {
  get users() {
    return getStore().users;
  },
  get posts() {
    return getStore().posts;
  },
  get admin() {
    return getStore().admin;
  },
  init: () => getStore().init(),
  close: () => getStore().close(),
};

export function loadApp(options: { mailer?: Mailer } = {}): Express {
  return createApp({ store: currentStore, ...options });
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined)
    throw new Error(`${name} is not set: test/api/support/env.ts has not run.`);
  return value;
}

// The settings tests need (e.g. to sign tokens), read from the env that support/env.ts set up.
// Never print these.
export function fakeConfig(): {
  CLIENT_URL: string;
  EMAIL_FROM: string;
  JWT_SECRET: string;
  COOKIE_EXPIRES_IN: string;
} {
  return {
    CLIENT_URL: requiredEnv('CLIENT_URL'),
    EMAIL_FROM: requiredEnv('EMAIL_FROM'),
    JWT_SECRET: requiredEnv('JWT_SECRET'),
    COOKIE_EXPIRES_IN: requiredEnv('COOKIE_EXPIRES_IN'),
  };
}

export interface FakeUser {
  name: string;
  email: string;
  password: string;
}

export function fakeUser(overrides: Partial<FakeUser> = {}): FakeUser {
  const id = randomBytes(4).toString('hex');
  return {
    name: `Tester ${id}`,
    email: `tester-${id}@example.test`,
    password: `pw-${randomBytes(6).toString('hex')}`,
    ...overrides,
  };
}

export async function registerAndActivate(app: Express, user: FakeUser): Promise<void> {
  const register = await supertest(app).post('/api/auth/register').send(user);
  if (register.status !== 200) throw new Error(`register failed with ${register.status}`);
  const token = tokenFromLink(extractLink(readLatestMail(user.email)));
  const activation = await supertest(app).post('/api/auth/account-activation').send({ token });
  if (activation.status !== 201) throw new Error(`activation failed with ${activation.status}`);
}

// Returns a supertest agent that carries the authtoken cookie, plus the login payload's user.
export async function login(
  app: Express,
  user: Pick<FakeUser, 'email' | 'password'>,
): Promise<{ agent: supertest.Agent; user: OwnUserDto }> {
  const agent = supertest.agent(app);
  const res = await agent
    .post('/api/auth/login')
    .send({ email: user.email, password: user.password });
  if (res.status !== 200) throw new Error(`login failed with ${res.status}`);
  return { agent, user: bodyOf<LoginResponse>(res).user };
}

export async function createUserAndLogin(
  app: Express,
  overrides?: Partial<FakeUser>,
): Promise<Session> {
  const user = fakeUser(overrides);
  await registerAndActivate(app, user);
  const session = await login(app, user);
  return { ...session, credentials: user };
}

export const LONG_DESCRIPTION =
  'This description is long enough to satisfy the fifty character minimum of the validator.';

export async function createPost(
  agent: supertest.Agent,
  fields: Record<string, unknown> = {},
): Promise<PostDto> {
  const res = await agent.post('/api/post').send({
    title: 'A test post',
    tag: 'testing',
    description: LONG_DESCRIPTION,
    ...fields,
  });
  if (res.status !== 201) throw new Error(`create post failed with ${res.status}`);
  return bodyOf<PostResponse>(res).post;
}

// Smallest valid PNG (1x1 pixel), used for multipart uploads.
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
