import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { clearDb, connectDb, disconnectDb, mongoose } from './support/db.js';
import { createPost, createUserAndLogin, loadApp } from './support/helpers.js';

describe('comments', () => {
  let app;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(clearDb);
  afterAll(disconnectDb);

  it('adds a comment, newest first, copying the author name and avatar', async () => {
    const { agent, user } = await createUserAndLogin(app);
    const post = await createPost(agent);

    const first = await agent.post(`/api/post/comment/${post._id}`).send({ comment: 'One' });
    const second = await agent.post(`/api/post/comment/${post._id}`).send({ comment: 'Two' });

    expect(first.status).toBe(201);
    expect(first.body.message).toBe('Comment has been added.');
    expect(first.body.results).toBe(1);
    expect(second.body.results).toBe(2);
    // The response key is the singular `comment`, and it holds the whole array.
    expect(second.body.comment.map((c) => c.comment)).toEqual(['Two', 'One']);
    expect(second.body.comment[0].name).toBe(user.name);
    expect(second.body.comment[0].userId).toBe(user._id);
    expect(second.body.comment[0].avatar).toBe('default.jpg');

    const fetched = await supertest(app).get(`/api/post/${post._id}`);
    expect(fetched.body.post.comments).toHaveLength(2);
  });

  it('requires a login and a non-empty comment', async () => {
    const { agent } = await createUserAndLogin(app);
    const post = await createPost(agent);

    const anonymous = await supertest(app)
      .post(`/api/post/comment/${post._id}`)
      .send({ comment: 'Hi' });
    expect(anonymous.status).toBe(401);

    const empty = await agent.post(`/api/post/comment/${post._id}`).send({ comment: '' });
    expect(empty.status).toBe(422);
    expect(empty.body.message).toBe('A comment is required.');
  });

  it('answers 404 when commenting on an unknown post', async () => {
    const { agent } = await createUserAndLogin(app);

    const res = await agent
      .post(`/api/post/comment/${new mongoose.Types.ObjectId()}`)
      .send({ comment: 'Hello?' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('User or Post data not found.');
  });

  it('deletes a comment as its author', async () => {
    const { agent } = await createUserAndLogin(app);
    const post = await createPost(agent);
    const added = await agent.post(`/api/post/comment/${post._id}`).send({ comment: 'Bye' });
    const commentId = added.body.comment[0]._id;

    const res = await agent.delete(`/api/post/comment/${post._id}/${commentId}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Comment has been deleted.');
    const fetched = await supertest(app).get(`/api/post/${post._id}`);
    expect(fetched.body.post.comments).toEqual([]);
  });

  it('answers 404 (with a `msg` key, not `message`) for an unknown comment id', async () => {
    const { agent } = await createUserAndLogin(app);
    const post = await createPost(agent);

    const res = await agent.delete(
      `/api/post/comment/${post._id}/${new mongoose.Types.ObjectId()}`,
    );

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ msg: 'Comment does not exist' });
  });
});

describe('likes', () => {
  let app;

  beforeAll(async () => {
    await connectDb();
    app = loadApp();
  });
  beforeEach(clearDb);
  afterAll(disconnectDb);

  it('likes and unlikes a post', async () => {
    const { agent, user } = await createUserAndLogin(app);
    const post = await createPost(agent);

    const like = await agent.put(`/api/post/like/${post._id}`);
    expect(like.status).toBe(200);
    expect(like.body.message).toBe('Post has been liked.');
    expect(like.body.results).toBe(1);
    expect(like.body.likes[0].user).toBe(user._id);

    const unlike = await agent.put(`/api/post/unlike/${post._id}`);
    expect(unlike.status).toBe(200);
    expect(unlike.body.message).toBe('Post has been disliked.');
    expect(unlike.body.results).toBe(0);
    expect(unlike.body.likes).toEqual([]);
  });

  it('refuses a second like and a second unlike with 400', async () => {
    const { agent } = await createUserAndLogin(app);
    const post = await createPost(agent);

    const unlikeFirst = await agent.put(`/api/post/unlike/${post._id}`);
    expect(unlikeFirst.status).toBe(400);
    expect(unlikeFirst.body.message).toBe('Post has not yet been liked.');

    await agent.put(`/api/post/like/${post._id}`);
    const likeTwice = await agent.put(`/api/post/like/${post._id}`);
    expect(likeTwice.status).toBe(400);
    expect(likeTwice.body.message).toBe('Post has already been liked.');
  });

  it('counts likes from different users separately', async () => {
    const alice = await createUserAndLogin(app);
    const bob = await createUserAndLogin(app);
    const post = await createPost(alice.agent);

    await alice.agent.put(`/api/post/like/${post._id}`);
    const bobLike = await bob.agent.put(`/api/post/like/${post._id}`);

    expect(bobLike.body.results).toBe(2);
    const fetched = await supertest(app).get(`/api/post/${post._id}`);
    expect(fetched.body.post.likes).toHaveLength(2);
  });

  it('requires a login to like', async () => {
    const { agent } = await createUserAndLogin(app);
    const post = await createPost(agent);

    const res = await supertest(app).put(`/api/post/like/${post._id}`);

    expect(res.status).toBe(401);
  });

  it('KNOWN BUG B5: liking an unknown post answers 401 "Please log in" instead of 404', async () => {
    const { agent } = await createUserAndLogin(app);

    const like = await agent.put(`/api/post/like/${new mongoose.Types.ObjectId()}`);
    const unlike = await agent.put(`/api/post/unlike/${new mongoose.Types.ObjectId()}`);

    expect(like.status).toBe(401);
    expect(like.body.message).toBe('Please log in to like this post');
    expect(unlike.status).toBe(401);
    expect(unlike.body.message).toBe('Please log in to unlike this post');
  });

  it('answers 404 for a malformed post id', async () => {
    const { agent } = await createUserAndLogin(app);

    const res = await agent.put('/api/post/like/not-an-id');

    expect(res.status).toBe(404);
  });
});
