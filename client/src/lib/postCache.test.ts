import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { createQueryClient } from './queryClient';
import { queryKeys } from './queryKeys';
import { patchPostInCaches, snapshotPostCaches, restorePostCaches } from './postCache';
import type { PostListPayload, PostWithAuthor } from './types';
import { makePost } from '../testing/fixtures';

const post = (id: string, likes = 0) =>
  makePost({ _id: id, likes: Array.from({ length: likes }, (_, i) => ({ user: `u${String(i)}` })) });
const addLike = (p: PostWithAuthor): PostWithAuthor => ({ ...p, likes: [...p.likes, { user: 'me' }] });

// What is cached under a key, as the type the test says it is; fails the test when nothing is.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- T only types what the cache holds
const cached = <T>(queryClient: QueryClient, key: QueryKey): T => {
  const data = queryClient.getQueryData<T>(key);
  if (data === undefined) throw new Error('nothing is cached under that key');
  return data;
};
interface InfinitePosts {
  pages: PostListPayload[];
}
interface PostPage {
  post: PostWithAuthor;
}

const seed = () => {
  const queryClient = createQueryClient({ retry: false });
  queryClient.setQueryData(queryKeys.posts.list(), { posts: [post('a'), post('b')] });
  queryClient.setQueryData(queryKeys.posts.list({ limit: 12 }), {
    pages: [{ posts: [post('a')], nextCursor: 'x' }, { posts: [post('c'), post('b')], nextCursor: null }],
    pageParams: [undefined, 'x'],
  });
  queryClient.setQueryData(queryKeys.posts.detail('b'), { post: post('b') });
  queryClient.setQueryData(queryKeys.posts.detail('a'), { post: post('a') });
  queryClient.setQueryData(queryKeys.users.posts('u1'), { posts: [post('b'), post('d')] });
  queryClient.setQueryData(queryKeys.users.detail('u1'), { user: { _id: 'u1' } });
  return queryClient;
};

describe('patchPostInCaches', () => {
  it('patches the post in lists, infinite pages, the post page and user post lists', () => {
    const queryClient = seed();
    patchPostInCaches(queryClient, 'b', addLike);
    expect(cached<PostListPayload>(queryClient, queryKeys.posts.list()).posts.map((p) => p.likes.length)).toEqual([0, 1]);
    expect(
      cached<InfinitePosts>(queryClient, queryKeys.posts.list({ limit: 12 })).pages.map((page) => page.posts.map((p) => p.likes.length)),
    ).toEqual([[0], [0, 1]]);
    expect(cached<PostPage>(queryClient, queryKeys.posts.detail('b')).post.likes).toHaveLength(1);
    expect(cached<PostListPayload>(queryClient, queryKeys.users.posts('u1')).posts.map((p) => p.likes.length)).toEqual([1, 0]);
  });

  it('leaves other posts and other queries alone, and keeps their identity', () => {
    const queryClient = seed();
    const detailA = cached<PostPage>(queryClient, queryKeys.posts.detail('a'));
    const userDetail = queryClient.getQueryData(queryKeys.users.detail('u1'));
    patchPostInCaches(queryClient, 'b', addLike);
    expect(cached<PostListPayload>(queryClient, queryKeys.posts.list()).posts[0]?.likes).toHaveLength(0);
    expect(cached<PostPage>(queryClient, queryKeys.posts.detail('a')).post).toBe(detailA.post);
    expect(queryClient.getQueryData(queryKeys.users.detail('u1'))).toBe(userDetail);
  });

  it('does nothing for a query that has no data yet', () => {
    const queryClient = createQueryClient({ retry: false });
    patchPostInCaches(queryClient, 'b', addLike);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});

describe('snapshot and restore', () => {
  it('puts every post cache back after an optimistic patch', async () => {
    const queryClient = seed();
    const snapshot = await snapshotPostCaches(queryClient);
    patchPostInCaches(queryClient, 'b', addLike);
    expect(cached<PostPage>(queryClient, queryKeys.posts.detail('b')).post.likes).toHaveLength(1);
    restorePostCaches(queryClient, snapshot);
    expect(cached<PostPage>(queryClient, queryKeys.posts.detail('b')).post.likes).toHaveLength(0);
    expect(cached<PostListPayload>(queryClient, queryKeys.posts.list()).posts[1]?.likes).toHaveLength(0);
    expect(cached<PostListPayload>(queryClient, queryKeys.users.posts('u1')).posts[0]?.likes).toHaveLength(0);
  });
});
