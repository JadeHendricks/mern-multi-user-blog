import supertest from 'supertest';
import type { OwnUserDto, PostDto, PublicUserDto } from '@mern-blog/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { clearDb, connectDb, disconnectDb, getStore } from './support/db.js';
import {
  createUserAndLogin,
  fakeUser,
  loadApp,
  LONG_DESCRIPTION,
  registerAndActivate,
} from './support/helpers.js';

describe('opt-in pagination', () => {
  let app: Express;
  let alice: OwnUserDto;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(async () => {
    await clearDb();
    alice = (await createUserAndLogin(app)).user;
    // Five posts by alice; two share a date so a cursor has to cope with ties.
    const dates = ['2025-12-01', '2025-12-02', '2025-12-03', '2025-12-03', '2025-12-04'];
    for (const [i, date] of dates.entries()) {
      const fields = {
        user: alice._id,
        title: `Post ${i + 1}`,
        description: LONG_DESCRIPTION,
        date: new Date(`${date}T09:00:00.000Z`),
      };
      await getStore().posts.create(fields);
    }
    // Two more activated users, plus one that stays pending.
    for (let i = 0; i < 2; i++) await registerAndActivate(app, fakeUser());
    await supertest(app).post('/api/auth/register').send(fakeUser());
  });
  afterAll(disconnectDb);

  const walk = async (url: string, listKey: string) => {
    const seen: string[] = [];
    let cursor: string | undefined;
    let pages = 0;
    do {
      const res = await supertest(app)
        .get(url)
        .query({ limit: 2, ...(cursor && { cursor }) });
      expect(res.status).toBe(200);
      seen.push(...res.body[listKey].map((item: { _id: string }) => item._id));
      cursor = res.body.nextCursor ?? undefined;
      pages += 1;
    } while (cursor);
    return { seen, pages };
  };

  it('returns everything with nextCursor null when no params are given', async () => {
    const posts = await supertest(app).get('/api/post');
    const mine = await supertest(app).get(`/api/post/user/${alice._id}`);
    const users = await supertest(app).get('/api/user');

    expect(posts.body).toMatchObject({ results: 5, nextCursor: null });
    expect(posts.body.posts).toHaveLength(5);
    expect(mine.body).toMatchObject({ message: 'success', results: 5, nextCursor: null });
    expect(users.body).toMatchObject({ message: 'success', nextCursor: null });
    // Pending accounts are never listed: alice plus the two activated users.
    expect(users.body.users).toHaveLength(3);
  });

  it("lists posts and a user's posts newest first, and users oldest first", async () => {
    const posts = await supertest(app).get('/api/post');
    const mine = await supertest(app).get(`/api/post/user/${alice._id}`);
    const users = await supertest(app).get('/api/user');

    const dates = posts.body.posts.map((post: PostDto) => post.date);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(mine.body.posts.map((post: PostDto) => post._id)).toEqual(
      posts.body.posts.map((post: PostDto) => post._id),
    );
    const joined = users.body.users.map((user: PublicUserDto) => user.createdAt);
    expect(joined).toEqual([...joined].sort());
    expect(users.body.users[0]._id).toBe(alice._id);
  });

  it.each([
    ['/api/post', 'posts', 5, 3],
    ['/api/user', 'users', 3, 2],
  ])('pages %s with limit=2 and visits every item once', async (url, key, total, pages) => {
    const all = (await supertest(app).get(url)).body[key].map((item: { _id: string }) => item._id);

    const walked = await walk(url, key);

    expect(walked.seen).toEqual(all);
    expect(new Set(walked.seen).size).toBe(total);
    expect(walked.pages).toBe(pages);
  });

  it("pages one user's posts, including the two that share a date", async () => {
    const all = (await supertest(app).get(`/api/post/user/${alice._id}`)).body.posts.map(
      (post: PostDto) => post._id,
    );

    const walked = await walk(`/api/post/user/${alice._id}`, 'posts');

    expect(walked.seen).toEqual(all);
    expect(walked.pages).toBe(3);
  });

  it('keeps nextCursor null on the last page and returns it only when more exist', async () => {
    const exact = await supertest(app).get('/api/post').query({ limit: 5 });
    const more = await supertest(app).get('/api/post').query({ limit: 4 });

    expect(exact.body.nextCursor).toBeNull();
    expect(more.body.nextCursor).toEqual(expect.any(String));
  });

  it.each([
    ['limit=0', { limit: '0' }],
    ['limit=101', { limit: '101' }],
    ['limit=abc', { limit: 'abc' }],
    ['limit=-1', { limit: '-1' }],
    ['limit=1.5', { limit: '1.5' }],
    ['a bad cursor', { cursor: 'not-a-cursor' }],
    ['an empty cursor', { cursor: '' }],
  ])('answers 422 for %s on every list endpoint', async (_label, query) => {
    for (const url of ['/api/post', `/api/post/user/${alice._id}`, '/api/user']) {
      const res = await supertest(app).get(url).query(query);
      expect(res.status, url).toBe(422);
      expect(res.body.message).toEqual(expect.any(String));
    }
  });

  it('answers 422 for a repeated limit', async () => {
    expect((await supertest(app).get('/api/post?limit=1&limit=2')).status).toBe(422);
  });

  it('accepts the limits 1 and 100', async () => {
    expect((await supertest(app).get('/api/post').query({ limit: 1 })).body.posts).toHaveLength(1);
    expect((await supertest(app).get('/api/post').query({ limit: 100 })).body.posts).toHaveLength(
      5,
    );
  });
});
