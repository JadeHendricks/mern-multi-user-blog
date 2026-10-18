import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { clearDb, connectDb, disconnectDb } from './support/db.js';
import { createPost, createUserAndLogin, LONG_DESCRIPTION, loadApp } from './support/helpers.js';

describe('permissions', () => {
  let app;
  let alice;
  let bob;
  let post;
  let commentId;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(async () => {
    await clearDb();
    alice = await createUserAndLogin(app);
    bob = await createUserAndLogin(app);
    post = await createPost(alice.agent, { title: 'Alice original' });
    const added = await alice.agent
      .post(`/api/post/comment/${post._id}`)
      .send({ comment: 'Alice comment' });
    commentId = added.body.comment[0]._id;
  });
  afterAll(disconnectDb);

  it('rejects a non-owner deleting a post with 401 and keeps the post', async () => {
    const res = await bob.agent.delete(`/api/post/${post._id}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('This post does not belong to you.');
    expect((await supertest(app).get(`/api/post/${post._id}`)).status).toBe(200);
  });

  it('rejects a non-owner deleting a comment with 401 and keeps the comment', async () => {
    const res = await bob.agent.delete(`/api/post/comment/${post._id}/${commentId}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ msg: 'User not authorized' });
    const fetched = await supertest(app).get(`/api/post/${post._id}`);
    expect(fetched.body.post.comments).toHaveLength(1);
  });

  it('lets the owner delete their own comment and post', async () => {
    const comment = await alice.agent.delete(`/api/post/comment/${post._id}/${commentId}`);
    expect(comment.status).toBe(200);

    const removed = await alice.agent.delete(`/api/post/${post._id}`);
    expect(removed.status).toBe(200);
  });

  it('rejects anonymous edit, delete, comment and like with 401', async () => {
    const edit = await supertest(app)
      .put(`/api/post/${post._id}`)
      .send({ id: post._id, title: 'x', description: LONG_DESCRIPTION });
    const remove = await supertest(app).delete(`/api/post/${post._id}`);
    const removeComment = await supertest(app).delete(`/api/post/comment/${post._id}/${commentId}`);
    const like = await supertest(app).put(`/api/post/like/${post._id}`);

    expect([edit.status, remove.status, removeComment.status, like.status]).toEqual([
      401, 401, 401, 401,
    ]);
  });

  it('refuses a non-owner edit with 403 and leaves the post unchanged', async () => {
    const res = await bob.agent.put(`/api/post/${post._id}`).send({
      id: post._id,
      title: 'Hijacked by Bob',
      description: LONG_DESCRIPTION,
    });

    expect(res.status).toBe(403);
    const fetched = await supertest(app).get(`/api/post/${post._id}`);
    expect(fetched.body.post.title).toBe('Alice original');
    expect(fetched.body.post.user._id).toBe(alice.user._id);
  });

  it('takes the target id from the URL and ignores req.body.id', async () => {
    const bobsPost = await createPost(bob.agent, { title: 'Bob original' });

    // Bob calls the URL of his own post but names Alice's post in the body.
    const res = await bob.agent.put(`/api/post/${bobsPost._id}`).send({
      id: post._id,
      title: 'Edited through the right URL',
      description: LONG_DESCRIPTION,
    });

    expect(res.status).toBe(200);
    expect(res.body.post._id).toBe(bobsPost._id);
    const alices = await supertest(app).get(`/api/post/${post._id}`);
    const bobs = await supertest(app).get(`/api/post/${bobsPost._id}`);
    expect(alices.body.post.title).toBe('Alice original');
    expect(bobs.body.post.title).toBe('Edited through the right URL');
  });});
