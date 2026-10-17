import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { clearDb, connectDb, disconnectDb, getStore, newId } from './support/db.js';
import {
  createPost,
  createUserAndLogin,
  LONG_DESCRIPTION,
  loadApp,
  TINY_PNG,
} from './support/helpers.js';

const clientPostImages = path.resolve(
  import.meta.dirname,
  '../../../client/src/assets/images/posts',
);
const list = (dir) => (existsSync(dir) ? readdirSync(dir).sort() : []);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('posts', () => {
  let app;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(clearDb);
  afterAll(disconnectDb);

  it('creates a post as a logged-in user', async () => {
    const { agent, user } = await createUserAndLogin(app);

    const res = await agent
      .post('/api/post')
      .send({ title: 'Hello', tag: 'news', description: LONG_DESCRIPTION });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Post "Hello", has been created');
    expect(res.body.post.title).toBe('Hello');
    expect(res.body.post.tag).toBe('news');
    expect(res.body.post.user).toBe(user._id);
    expect(res.body.post.image).toBe('default.jpg');
    expect(res.body.post.likes).toEqual([]);
    expect(res.body.post.comments).toEqual([]);
  });

  it('defaults the tag to "general"', async () => {
    const { agent } = await createUserAndLogin(app);

    const res = await agent
      .post('/api/post')
      .send({ title: 'No tag', description: LONG_DESCRIPTION });

    expect(res.status).toBe(201);
    expect(res.body.post.tag).toBe('general');
  });

  it('requires a login and valid fields to create a post', async () => {
    const anonymous = await supertest(app)
      .post('/api/post')
      .send({ title: 'Hi', description: LONG_DESCRIPTION });
    expect(anonymous.status).toBe(401);

    const { agent } = await createUserAndLogin(app);
    const noTitle = await agent.post('/api/post').send({ description: LONG_DESCRIPTION });
    expect(noTitle.status).toBe(422);
    expect(noTitle.body.message).toBe('Title is required.');

    const shortDescription = await agent
      .post('/api/post')
      .send({ title: 'Hi', description: 'short' });
    expect(shortDescription.status).toBe(422);
    expect(shortDescription.body.message).toBe('Description must be atleast 50 characters long.');
  });

  it('stores an uploaded image under DATA_DIR/uploads and not in the client source tree', async () => {
    const beforeClient = list(clientPostImages);
    const { agent } = await createUserAndLogin(app);

    const res = await agent
      .post('/api/post')
      .field('title', 'With image')
      .field('tag', 'photos')
      .field('description', LONG_DESCRIPTION)
      .attach('image', TINY_PNG, { filename: 'tiny.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.post.image).toMatch(/^post-[0-9a-f]{32}\.png$/);

    const uploaded = path.join(process.env.DATA_DIR, 'uploads', 'posts', res.body.post.image);
    expect(existsSync(uploaded)).toBe(true);
    expect(list(clientPostImages)).toEqual(beforeClient);
  });

  it('rejects a non-image upload with a JSON 400', async () => {
    const { agent } = await createUserAndLogin(app);

    const res = await agent
      .post('/api/post')
      .field('title', 'Bad file')
      .field('description', LONG_DESCRIPTION)
      .attach('image', Buffer.from('plain text'), { filename: 'a.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
    expect((await getStore().admin.counts()).posts).toBe(0);
  });

  it('gets one post with the author populated', async () => {
    const { agent, user } = await createUserAndLogin(app);
    const created = await createPost(agent, { title: 'Findable' });

    const res = await supertest(app).get(`/api/post/${created._id}`);

    expect(res.status).toBe(200);
    expect(res.body.post.title).toBe('Findable');
    expect(res.body.post.user._id).toBe(user._id);
    expect(res.body.post.user.name).toBe(user.name);
  });

  it('answers 404 for an unknown or malformed post id', async () => {
    const unknown = await supertest(app).get(`/api/post/${newId()}`);
    expect(unknown.status).toBe(404);
    expect(unknown.body.message).toBe('Post not found');

    const malformed = await supertest(app).get('/api/post/not-an-id');
    expect(malformed.status).toBe(404);
    expect(malformed.body.message).toBe('Post not found');
  });

  it('lists posts newest first with a result count', async () => {
    const { agent } = await createUserAndLogin(app);
    await createPost(agent, { title: 'First' });
    await sleep(15);
    await createPost(agent, { title: 'Second' });
    await sleep(15);
    await createPost(agent, { title: 'Third' });

    const res = await supertest(app).get('/api/post');

    expect(res.status).toBe(200);
    expect(res.body.results).toBe(3);
    expect(res.body.posts.map((p) => p.title)).toEqual(['Third', 'Second', 'First']);
  });

  it('lists the posts of one user', async () => {
    const alice = await createUserAndLogin(app);
    const bob = await createUserAndLogin(app);
    await createPost(alice.agent, { title: 'Alice 1' });
    await createPost(alice.agent, { title: 'Alice 2' });
    await createPost(bob.agent, { title: 'Bob 1' });

    const res = await supertest(app).get(`/api/post/user/${alice.user._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('success');
    expect(res.body.results).toBe(2);
    expect(res.body.posts.map((p) => p.title).sort()).toEqual(['Alice 1', 'Alice 2']);
  });

  it('edits a post as its owner (id is read from the body)', async () => {
    const { agent } = await createUserAndLogin(app);
    const created = await createPost(agent, { title: 'Before' });

    const res = await agent.put(`/api/post/${created._id}`).send({
      id: created._id,
      title: 'After',
      tag: 'edited',
      description: `${LONG_DESCRIPTION} Edited.`,
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Post has been updated');
    expect(res.body.post.title).toBe('After');
    expect(res.body.post.tag).toBe('edited');

    const fetched = await supertest(app).get(`/api/post/${created._id}`);
    expect(fetched.body.post.title).toBe('After');
  });

  it('edits a post with a multipart image', async () => {
    const beforeClient = list(clientPostImages);
    const { agent } = await createUserAndLogin(app);
    const created = await createPost(agent);

    const res = await agent
      .put(`/api/post/${created._id}`)
      .field('id', created._id)
      .field('title', 'Edited with image')
      .field('description', LONG_DESCRIPTION)
      .attach('image', TINY_PNG, { filename: 'tiny.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.post.image).toMatch(/^post-[0-9a-f]{32}\.png$/);
    expect(
      existsSync(path.join(process.env.DATA_DIR, 'uploads', 'posts', res.body.post.image)),
    ).toBe(true);
    expect(list(clientPostImages)).toEqual(beforeClient);
  });

  it('validates the edit payload', async () => {
    const { agent } = await createUserAndLogin(app);
    const created = await createPost(agent);

    const res = await agent
      .put(`/api/post/${created._id}`)
      .send({ id: created._id, title: '', description: LONG_DESCRIPTION });

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Title is required.');
  });

  it('deletes a post as its owner and then answers 404', async () => {
    const { agent } = await createUserAndLogin(app);
    const created = await createPost(agent);

    const res = await agent.delete(`/api/post/${created._id}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Post has been deleted.');

    const after = await supertest(app).get(`/api/post/${created._id}`);
    expect(after.status).toBe(404);
  });

  it('answers 404 when deleting an unknown post', async () => {
    const { agent } = await createUserAndLogin(app);

    const res = await agent.delete(`/api/post/${newId()}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Post not found.');
  });
});

describe('length limits', () => {
  let app;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(clearDb);
  afterAll(disconnectDb);

  it('rejects a 101-character title and accepts a 100-character one', async () => {
    const { agent } = await createUserAndLogin(app);

    const tooLong = await agent
      .post('/api/post')
      .send({ title: 'a'.repeat(101), description: LONG_DESCRIPTION });
    const ok = await agent
      .post('/api/post')
      .send({ title: 'a'.repeat(100), description: LONG_DESCRIPTION });

    expect(tooLong.status).toBeGreaterThanOrEqual(400);
    expect(ok.status).toBe(201);
  });

  it('rejects a 33-character user name at the storage level', async () => {
    const user = (name, email) => getStore().users.create({ name, email, passwordHash: 'x' });

    await expect(user('n'.repeat(33), 'long@example.test')).rejects.toThrow(
      /maximum allowed length/,
    );
    await expect(user('n'.repeat(32), 'ok@example.test')).resolves.toMatchObject({
      name: 'n'.repeat(32),
    });
  });
});
