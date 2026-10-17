import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import supertest from 'supertest';
import type { CommentDto, LikeDto } from '@mern-blog/shared';
import { clearDb, connectDb, disconnectDb, newId } from './support/db.js';
import {
  createPost,
  createUserAndLogin,
  fakeUser,
  loadApp,
  registerAndActivate,
} from './support/helpers.js';
import { extractLink, readLatestMail, tokenFromLink } from './support/outbox.js';

// Response-shape contract: status plus the EXACT key set of every body. These tests must pass
// unchanged on every storage adapter, so a storage swap cannot change what the client receives.
// Key names only, never values. `__v` (a Mongoose bookkeeping field) is deliberately not part of
// the contract and is stripped before comparing.
const keysOf = (object: object) =>
  Object.keys(object)
    .filter((key) => key !== '__v')
    .sort();

const OWNER_KEYS = ['_id', 'avatar', 'createdAt', 'email', 'name', 'role', 'status', 'updatedAt'];
const PUBLIC_USER_KEYS = ['_id', 'avatar', 'createdAt', 'name'];
const POST_KEYS = [
  '_id',
  'comments',
  'date',
  'description',
  'image',
  'likes',
  'tag',
  'title',
  'user',
];
const COMMENT_KEYS = ['_id', 'avatar', 'comment', 'date', 'name', 'userId'];

describe('response shape contract', () => {
  let app: Express;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(clearDb);
  afterAll(disconnectDb);

  describe('auth', () => {
    it('register, activation preview, activation, login, isloggedin, logout', async () => {
      const user = fakeUser();

      const register = await supertest(app).post('/api/auth/register').send(user);
      expect(register.status).toBe(200);
      expect(keysOf(register.body)).toEqual(['message']);

      const token = tokenFromLink(extractLink(readLatestMail(user.email)));
      const preview = await supertest(app).get(`/api/auth/account-activation/${token}`);
      expect(preview.status).toBe(200);
      expect(keysOf(preview.body)).toEqual(['name']);

      const activation = await supertest(app).post('/api/auth/account-activation').send({ token });
      expect(activation.status).toBe(201);
      expect(keysOf(activation.body)).toEqual(['message']);

      const again = await supertest(app).post('/api/auth/account-activation').send({ token });
      expect(again.status).toBe(409);
      expect(keysOf(again.body)).toEqual(['message']);

      const agent = supertest.agent(app);
      const login = await agent
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });
      expect(login.status).toBe(200);
      expect(keysOf(login.body)).toEqual(['user']);
      expect(keysOf(login.body.user)).toEqual(OWNER_KEYS);

      const loggedIn = await agent.get('/api/auth/isloggedin');
      expect(loggedIn.status).toBe(200);
      expect(keysOf(loggedIn.body)).toEqual(['message']);

      const logout = await agent.post('/api/auth/logout');
      expect(logout.status).toBe(200);
      expect(keysOf(logout.body)).toEqual(['message']);
    });

    it('error bodies are { message } only', async () => {
      const invalid = await supertest(app)
        .post('/api/auth/register')
        .send({ name: '', email: 'x', password: '1' });
      expect(invalid.status).toBe(422);
      expect(keysOf(invalid.body)).toEqual(['message']);

      const user = fakeUser();
      const wrong = await supertest(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });
      expect(wrong.status).toBe(401);
      expect(keysOf(wrong.body)).toEqual(['message']);

      const notLoggedIn = await supertest(app).get('/api/auth/isloggedin');
      expect(notLoggedIn.status).toBe(401);
      expect(keysOf(notLoggedIn.body)).toEqual(['message']);

      const noToken = await supertest(app).post('/api/auth/account-activation').send({});
      expect(noToken.status).toBe(400);
      expect(keysOf(noToken.body)).toEqual(['message']);

      const expired = await supertest(app)
        .post('/api/auth/account-activation')
        .send({ token: 'nope' });
      expect(expired.status).toBe(401);
      expect(keysOf(expired.body)).toEqual(['message']);

      const preview = await supertest(app).get('/api/auth/account-activation/nope');
      expect(preview.status).toBe(404);
      expect(keysOf(preview.body)).toEqual(['message']);
    });

    it('forgot and reset password', async () => {
      const user = fakeUser();
      await registerAndActivate(app, user);

      const forgot = await supertest(app)
        .put('/api/auth/forgot-password')
        .send({ email: user.email });
      expect(forgot.status).toBe(200);
      expect(keysOf(forgot.body)).toEqual(['message']);

      const token = tokenFromLink(extractLink(readLatestMail(user.email)));
      const reset = await supertest(app)
        .put('/api/auth/reset-password')
        .send({ resetPasswordLink: token, newPassword: 'a-new-secret-1' });
      expect(reset.status).toBe(200);
      expect(keysOf(reset.body)).toEqual(['message']);

      const bad = await supertest(app)
        .put('/api/auth/reset-password')
        .send({ resetPasswordLink: token, newPassword: 'a-new-secret-1' });
      expect(bad.status).toBe(400);
      expect(keysOf(bad.body)).toEqual(['message']);
    });
  });

  describe('users', () => {
    it('list, public user, me, update me, socials', async () => {
      const { agent, user } = await createUserAndLogin(app);
      await createUserAndLogin(app);

      const list = await supertest(app).get('/api/user');
      expect(list.status).toBe(200);
      expect(keysOf(list.body)).toEqual(['message', 'nextCursor', 'users']);
      expect(list.body.users).toHaveLength(2);
      for (const item of list.body.users) expect(keysOf(item)).toEqual(PUBLIC_USER_KEYS);

      const one = await supertest(app).get(`/api/user/${user._id}`);
      expect(one.status).toBe(200);
      expect(keysOf(one.body)).toEqual(['message', 'user']);
      expect(keysOf(one.body.user)).toEqual(PUBLIC_USER_KEYS);

      const me = await agent.get('/api/user/me');
      expect(me.status).toBe(200);
      expect(keysOf(me.body)).toEqual(['message', 'user']);
      expect(keysOf(me.body.user)).toEqual(OWNER_KEYS);
      // socials are absent until one has been set
      expect('socials' in me.body.user).toBe(false);

      const update = await agent.put('/api/user/me').send({ name: 'Renamed' });
      expect(update.status).toBe(200);
      expect(keysOf(update.body)).toEqual(['message', 'user']);
      expect(keysOf(update.body.user)).toEqual(OWNER_KEYS);

      const socials = await agent
        .put(`/api/user/${user._id}/socials`)
        .send({ twitter: 'https://twitter.com/me' });
      expect(socials.status).toBe(200);
      expect(keysOf(socials.body)).toEqual(['message', 'user']);
      expect(keysOf(socials.body.user)).toEqual([...OWNER_KEYS, 'socials'].sort());
      expect(keysOf(socials.body.user.socials)).toEqual(['twitter']);

      // cleared with '' stays as an empty string, it is not removed
      const cleared = await agent.put(`/api/user/${user._id}/socials`).send({ twitter: '' });
      expect(cleared.body.user.socials.twitter).toBe('');

      const publicWithSocials = await supertest(app).get(`/api/user/${user._id}`);
      expect(keysOf(publicWithSocials.body.user)).toEqual([...PUBLIC_USER_KEYS, 'socials'].sort());
    });

    it('error bodies', async () => {
      const unknown = await supertest(app).get(`/api/user/${newId()}`);
      expect(unknown.status).toBe(400);
      expect(keysOf(unknown.body)).toEqual(['message']);

      const noLogin = await supertest(app).get('/api/user/me');
      expect(noLogin.status).toBe(401);
      expect(keysOf(noLogin.body)).toEqual(['message']);

      const { agent, user } = await createUserAndLogin(app);
      const invalid = await agent
        .put(`/api/user/${user._id}/socials`)
        .send({ twitter: 'http://x.test' });
      expect(invalid.status).toBe(422);
      expect(keysOf(invalid.body)).toEqual(['message']);
    });
  });

  describe('posts', () => {
    it('list, detail, create, edit, user posts', async () => {
      const { agent, user } = await createUserAndLogin(app);

      const created = await agent.post('/api/post').send({
        title: 'Shape',
        description:
          'This description is long enough to satisfy the fifty character minimum of the validator.',
      });
      expect(created.status).toBe(201);
      expect(keysOf(created.body)).toEqual(['message', 'post']);
      expect(keysOf(created.body.post)).toEqual(POST_KEYS);
      // create returns the author as a plain id
      expect(created.body.post.user).toBe(user._id);
      expect(created.body.post.image).toBe('default.jpg');
      expect(created.body.post.tag).toBe('general');

      const id = created.body.post._id;

      const list = await supertest(app).get('/api/post');
      expect(list.status).toBe(200);
      expect(keysOf(list.body)).toEqual(['nextCursor', 'posts', 'results']);
      expect(list.body.results).toBe(1);
      expect(keysOf(list.body.posts[0])).toEqual(POST_KEYS);
      expect(keysOf(list.body.posts[0].user)).toEqual(['_id', 'avatar', 'name']);

      const detail = await supertest(app).get(`/api/post/${id}`);
      expect(detail.status).toBe(200);
      expect(keysOf(detail.body)).toEqual(['post']);
      expect(keysOf(detail.body.post)).toEqual(POST_KEYS);
      expect(keysOf(detail.body.post.user)).toEqual(['_id', 'avatar', 'name']);

      const edited = await agent.put(`/api/post/${id}`).send({
        title: 'Shape 2',
        description:
          'This description is long enough to satisfy the fifty character minimum of the validator.',
      });
      expect(edited.status).toBe(200);
      expect(keysOf(edited.body)).toEqual(['message', 'post']);
      expect(keysOf(edited.body.post)).toEqual(POST_KEYS);
      expect(edited.body.post.user).toBe(user._id);
      expect(edited.body.post.title).toBe('Shape 2');

      const mine = await supertest(app).get(`/api/post/user/${user._id}`);
      expect(mine.status).toBe(200);
      expect(keysOf(mine.body)).toEqual(['message', 'nextCursor', 'posts', 'results']);
      expect(keysOf(mine.body.posts[0])).toEqual(POST_KEYS);
      expect(keysOf(mine.body.posts[0].user)).toEqual(['_id', 'avatar', 'name']);

      const removed = await agent.delete(`/api/post/${id}`);
      expect(removed.status).toBe(200);
      expect(keysOf(removed.body)).toEqual(['message']);
    });

    it('likes: newest first, { _id, user } entries', async () => {
      const alice = await createUserAndLogin(app);
      const bob = await createUserAndLogin(app);
      const post = await createPost(alice.agent);

      const first = await alice.agent.put(`/api/post/like/${post._id}`);
      expect(first.status).toBe(200);
      expect(keysOf(first.body)).toEqual(['likes', 'message', 'results']);
      expect(keysOf(first.body.likes[0])).toEqual(['_id', 'user']);

      const second = await bob.agent.put(`/api/post/like/${post._id}`);
      expect(second.body.results).toBe(2);
      expect(second.body.likes.map((like: LikeDto) => like.user)).toEqual([
        bob.user._id,
        alice.user._id,
      ]);

      const again = await bob.agent.put(`/api/post/like/${post._id}`);
      expect(again.status).toBe(400);
      expect(keysOf(again.body)).toEqual(['message']);

      const unlike = await bob.agent.put(`/api/post/unlike/${post._id}`);
      expect(unlike.status).toBe(200);
      expect(keysOf(unlike.body)).toEqual(['likes', 'message', 'results']);
      expect(unlike.body.results).toBe(1);

      const notLiked = await bob.agent.put(`/api/post/unlike/${post._id}`);
      expect(notLiked.status).toBe(400);
      expect(keysOf(notLiked.body)).toEqual(['message']);
    });

    it('comments: newest first with userId, name and avatar', async () => {
      const alice = await createUserAndLogin(app);
      const post = await createPost(alice.agent);

      const one = await alice.agent
        .post(`/api/post/comment/${post._id}`)
        .send({ comment: 'first' });
      expect(one.status).toBe(201);
      expect(keysOf(one.body)).toEqual(['comment', 'message', 'results']);
      expect(keysOf(one.body.comment[0])).toEqual(COMMENT_KEYS);

      const two = await alice.agent
        .post(`/api/post/comment/${post._id}`)
        .send({ comment: 'second' });
      expect(two.body.results).toBe(2);
      expect(two.body.comment.map((item: CommentDto) => item.comment)).toEqual(['second', 'first']);
      expect(two.body.comment[0].userId).toBe(alice.user._id);
      expect(two.body.comment[0].name).toBe(alice.user.name);
      expect(two.body.comment[0].avatar).toBe(alice.user.avatar);

      const detail = await supertest(app).get(`/api/post/${post._id}`);
      expect(keysOf(detail.body.post.comments[0])).toEqual(COMMENT_KEYS);

      const removed = await alice.agent.delete(
        `/api/post/comment/${post._id}/${two.body.comment[0]._id}`,
      );
      expect(removed.status).toBe(200);
      expect(keysOf(removed.body)).toEqual(['message']);
    });

    it('error bodies', async () => {
      const { agent } = await createUserAndLogin(app);

      const missing = await supertest(app).get(`/api/post/${newId()}`);
      expect(missing.status).toBe(404);
      expect(keysOf(missing.body)).toEqual(['message']);

      const malformed = await supertest(app).get('/api/post/not-an-id');
      expect(malformed.status).toBe(404);
      expect(keysOf(malformed.body)).toEqual(['message']);

      const invalid = await agent.post('/api/post').send({ title: '' });
      expect(invalid.status).toBe(422);
      expect(keysOf(invalid.body)).toEqual(['message']);

      const noLogin = await supertest(app).post('/api/post').send({ title: 'x' });
      expect(noLogin.status).toBe(401);
      expect(keysOf(noLogin.body)).toEqual(['message']);

      const noComment = await agent.post(`/api/post/comment/${newId()}`).send({ comment: 'hi' });
      expect(noComment.status).toBe(404);
      expect(keysOf(noComment.body)).toEqual(['message']);
    });
  });
});
