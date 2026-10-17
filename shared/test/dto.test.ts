import { describe, expect, it } from 'vitest';
import {
  commentSchema,
  commentsResponseSchema,
  DEFAULT_AVATAR,
  DESCRIPTION_MIN,
  errorBodySchema,
  IMAGE_MIME_TYPES,
  likeSchema,
  likesResponseSchema,
  loginResponseSchema,
  MAX_IMAGE_BYTES,
  MAX_LIMIT,
  meResponseSchema,
  messageResponseSchema,
  NAME_MAX,
  ownUserSchema,
  PASSWORD_MIN,
  postAuthorSchema,
  postDetailResponseSchema,
  postListResponseSchema,
  postResponseSchema,
  postSchema,
  publicUserResponseSchema,
  publicUserSchema,
  SOCIAL_MAX,
  socialsSchema,
  TITLE_MAX,
  userListResponseSchema,
  type PostDto,
} from '../src/index.js';

// Key sets pinned by server/test/api/contracts.test.js. Both sides must stay in step: a key added to
// an API body has to be added to the schema, and to that contract test.
const keysOf = (schema: { shape: Record<string, unknown> }) => Object.keys(schema.shape).sort();

describe('DTO schemas list the keys the API contract pins', () => {
  it('users', () => {
    expect(keysOf(ownUserSchema)).toEqual(
      [
        '_id',
        'avatar',
        'createdAt',
        'email',
        'name',
        'role',
        'status',
        'updatedAt',
        'socials',
      ].sort(),
    );
    expect(keysOf(publicUserSchema)).toEqual(['_id', 'avatar', 'createdAt', 'name', 'socials']);
    expect(keysOf(socialsSchema)).toEqual(['facebook', 'linkedin', 'twitter']);
  });

  it('posts, comments and likes', () => {
    expect(keysOf(postSchema)).toEqual([
      '_id',
      'comments',
      'date',
      'description',
      'image',
      'likes',
      'tag',
      'title',
      'user',
    ]);
    expect(keysOf(commentSchema)).toEqual(['_id', 'avatar', 'comment', 'date', 'name', 'userId']);
    expect(keysOf(likeSchema)).toEqual(['_id', 'user']);
    expect(keysOf(postAuthorSchema)).toEqual(['_id', 'avatar', 'name', 'socials']);
  });

  it('envelopes', () => {
    expect(keysOf(messageResponseSchema)).toEqual(['message']);
    expect(keysOf(errorBodySchema)).toEqual(['message']);
    expect(keysOf(loginResponseSchema)).toEqual(['user']);
    expect(keysOf(meResponseSchema)).toEqual(['message', 'user']);
    expect(keysOf(publicUserResponseSchema)).toEqual(['message', 'user']);
    expect(keysOf(userListResponseSchema)).toEqual(['message', 'nextCursor', 'users']);
    expect(keysOf(postListResponseSchema)).toEqual(['message', 'nextCursor', 'posts', 'results']);
    expect(keysOf(postResponseSchema)).toEqual(['message', 'post']);
    expect(keysOf(postDetailResponseSchema)).toEqual(['post']);
    expect(keysOf(likesResponseSchema)).toEqual(['likes', 'message', 'results']);
    expect(keysOf(commentsResponseSchema)).toEqual(['comment', 'message', 'results']);
  });
});

describe('DTO schemas accept the shapes the API sends', () => {
  const id = (n: number) => n.toString(16).padStart(24, '0');
  const date = new Date('2026-01-02T03:04:05.678Z').toISOString();
  const owner = {
    _id: id(1),
    name: 'Ann',
    email: 'ann@example.test',
    avatar: DEFAULT_AVATAR,
    role: 'user',
    status: 'active',
    createdAt: date,
    updatedAt: date,
  };
  const comment = {
    _id: id(4),
    comment: 'hi',
    date,
    userId: id(1),
    name: 'Ann',
    avatar: DEFAULT_AVATAR,
  };
  const post = {
    _id: id(2),
    user: { _id: id(1), name: 'Ann', avatar: DEFAULT_AVATAR },
    image: 'default.jpg',
    title: 'Title',
    tag: 'general',
    description: 'x'.repeat(DESCRIPTION_MIN),
    likes: [{ _id: id(3), user: id(1) }],
    comments: [comment],
    date,
  } satisfies PostDto;

  it('own and public users, with and without socials', () => {
    expect(ownUserSchema.parse(owner)).toEqual(owner);
    const withSocials = { ...owner, socials: { twitter: 'https://twitter.com/me', facebook: '' } };
    expect(ownUserSchema.parse(withSocials)).toEqual(withSocials);
    expect(
      publicUserSchema.safeParse({ _id: id(1), name: 'Ann', avatar: 'a.jpg', createdAt: date })
        .success,
    ).toBe(true);
  });

  it('posts: author as an id, as a populated user, or gone', () => {
    expect(postSchema.safeParse(post).success).toBe(true);
    expect(postSchema.safeParse({ ...post, user: id(1) }).success).toBe(true);
    expect(postSchema.safeParse({ ...post, user: null }).success).toBe(true);
    expect(
      postSchema.safeParse({
        ...post,
        user: { ...post.user, socials: { twitter: 'https://x.test' } },
      }).success,
    ).toBe(true);
  });

  it('list and detail envelopes', () => {
    expect(
      postListResponseSchema.safeParse({ posts: [post], results: 1, nextCursor: null }).success,
    ).toBe(true);
    expect(
      postListResponseSchema.safeParse({
        message: 'ok',
        posts: [post],
        results: 1,
        nextCursor: 'abc',
      }).success,
    ).toBe(true);
    expect(postDetailResponseSchema.safeParse({ post }).success).toBe(true);
    expect(
      userListResponseSchema.safeParse({
        message: 'ok',
        users: [{ _id: id(1), name: 'Ann', avatar: 'a.jpg', createdAt: date }],
        nextCursor: null,
      }).success,
    ).toBe(true);
    expect(
      likesResponseSchema.safeParse({ message: 'ok', results: 1, likes: post.likes }).success,
    ).toBe(true);
    expect(
      commentsResponseSchema.safeParse({ message: 'ok', results: 1, comment: [comment] }).success,
    ).toBe(true);
  });

  it('rejects an id or a date in the wrong form', () => {
    expect(postSchema.safeParse({ ...post, _id: 'not-an-id' }).success).toBe(false);
    expect(postSchema.safeParse({ ...post, date: 'yesterday' }).success).toBe(false);
    expect(ownUserSchema.safeParse({ ...owner, role: 'root' }).success).toBe(false);
  });
});

describe('constants', () => {
  it('match the limits the API has always enforced', () => {
    expect(NAME_MAX).toBe(32);
    expect(TITLE_MAX).toBe(100);
    expect(DESCRIPTION_MIN).toBe(50);
    expect(PASSWORD_MIN).toBe(6);
    expect(SOCIAL_MAX).toBe(200);
    expect(MAX_LIMIT).toBe(100);
    expect(MAX_IMAGE_BYTES).toBe(2 * 1024 * 1024);
    expect([...IMAGE_MIME_TYPES]).toEqual(['image/jpeg', 'image/png', 'image/webp']);
    expect(DEFAULT_AVATAR).toBe('default.jpg');
  });
});
