import { existsSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { clearDb, connectDb, disconnectDb, getStore } from './support/db.js';
import { createUserAndLogin, LONG_DESCRIPTION, loadApp, TINY_PNG } from './support/helpers.js';

const uploadPath = (sub, name) => path.join(process.env.UPLOAD_DIR, sub, name);
const png = { filename: 'tiny.png', contentType: 'image/png' };

describe('uploads', () => {
  let app;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(clearDb);
  afterAll(disconnectDb);

  const createWithImage = (agent, file = TINY_PNG, options = png) =>
    agent
      .post('/api/post')
      .field('title', 'With image')
      .field('description', LONG_DESCRIPTION)
      .attach('image', file, options);

  it('answers 413 JSON for a file over 2 MB and stores nothing', async () => {
    const { agent } = await createUserAndLogin(app);
    const before = readdirSync(path.join(process.env.UPLOAD_DIR, 'posts'));

    const res = await createWithImage(agent, Buffer.alloc(3 * 1024 * 1024, 1));

    expect(res.status).toBe(413);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.message).toBeDefined();
    expect(readdirSync(path.join(process.env.UPLOAD_DIR, 'posts'))).toEqual(before);
    expect((await getStore().admin.counts()).posts).toBe(0);
  });

  it.each([
    ['image/svg+xml', 'a.svg'],
    ['text/plain', 'a.txt'],
  ])('answers 400 JSON for %s', async (contentType, filename) => {
    const { agent } = await createUserAndLogin(app);

    const res = await createWithImage(agent, Buffer.from('<svg/>'), { filename, contentType });

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/json/);
  });

  it.each([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
  ])('stores %s under a random .%s name', async (contentType, ext) => {
    const { agent, user } = await createUserAndLogin(app);

    const res = await createWithImage(agent, TINY_PNG, { filename: 'whatever.exe', contentType });

    expect(res.status).toBe(201);
    expect(res.body.post.image).toMatch(new RegExp(`^post-[0-9a-f]{32}\\.${ext}$`));
    expect(res.body.post.image).not.toContain(user._id);
    expect(existsSync(uploadPath('posts', res.body.post.image))).toBe(true);
  });

  it('removes the stored file when the post is deleted', async () => {
    const { agent } = await createUserAndLogin(app);
    const created = await createWithImage(agent);
    const file = uploadPath('posts', created.body.post.image);
    expect(existsSync(file)).toBe(true);

    const res = await agent.delete(`/api/post/${created.body.post._id}`);

    expect(res.status).toBe(200);
    expect(existsSync(file)).toBe(false);
  });

  it('removes the old file when a post image is replaced', async () => {
    const { agent } = await createUserAndLogin(app);
    const created = await createWithImage(agent);
    const oldFile = uploadPath('posts', created.body.post.image);

    const res = await agent
      .put(`/api/post/${created.body.post._id}`)
      .field('title', 'New image')
      .field('description', LONG_DESCRIPTION)
      .attach('image', TINY_PNG, png);

    expect(res.status).toBe(200);
    expect(res.body.post.image).not.toBe(created.body.post.image);
    expect(existsSync(oldFile)).toBe(false);
    expect(existsSync(uploadPath('posts', res.body.post.image))).toBe(true);
  });

  it('deletes a post whose file is already gone and one that uses the default image', async () => {
    const { agent } = await createUserAndLogin(app);
    const withFile = await createWithImage(agent);
    const plain = (await agent.post('/api/post').send({ title: 'plain', description: LONG_DESCRIPTION })).body.post;
    // The file disappears before the delete: ENOENT must not turn into an error.
    rmSync(uploadPath('posts', withFile.body.post.image));

    const first = await agent.delete(`/api/post/${withFile.body.post._id}`);
    const second = await agent.delete(`/api/post/${plain._id}`);

    expect([first.status, second.status]).toEqual([200, 200]);
  });

  it('removes the old avatar when it is replaced and keeps default.jpg out of it', async () => {
    const { agent } = await createUserAndLogin(app);

    const first = await agent.put('/api/user/me').field('name', 'Avatar One').attach('avatar', TINY_PNG, png);
    expect(first.status).toBe(200);
    expect(first.body.user.avatar).toMatch(/^user-[0-9a-f]{32}\.png$/);
    const firstFile = uploadPath('users', first.body.user.avatar);
    expect(existsSync(firstFile)).toBe(true);

    const second = await agent.put('/api/user/me').field('name', 'Avatar Two').attach('avatar', TINY_PNG, png);

    expect(second.status).toBe(200);
    expect(existsSync(firstFile)).toBe(false);
    expect(existsSync(uploadPath('users', second.body.user.avatar))).toBe(true);
  });
});
