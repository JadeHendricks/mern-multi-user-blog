import { createQueryClient } from './queryClient';
import { queryKeys } from './queryKeys';
import { patchPostInCaches, snapshotPostCaches, restorePostCaches } from './postCache';

const post = (id, likes = 0) => ({ _id: id, likes: Array.from({ length: likes }, (_, i) => ({ user: `u${i}` })) });
const addLike = (p) => ({ ...p, likes: [...p.likes, { user: 'me' }] });

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
    expect(queryClient.getQueryData(queryKeys.posts.list()).posts.map((p) => p.likes.length)).toEqual([0, 1]);
    expect(
      queryClient.getQueryData(queryKeys.posts.list({ limit: 12 })).pages.map((page) => page.posts.map((p) => p.likes.length)),
    ).toEqual([[0], [0, 1]]);
    expect(queryClient.getQueryData(queryKeys.posts.detail('b')).post.likes).toHaveLength(1);
    expect(queryClient.getQueryData(queryKeys.users.posts('u1')).posts.map((p) => p.likes.length)).toEqual([1, 0]);
  });

  it('leaves other posts and other queries alone, and keeps their identity', () => {
    const queryClient = seed();
    const detailA = queryClient.getQueryData(queryKeys.posts.detail('a'));
    const userDetail = queryClient.getQueryData(queryKeys.users.detail('u1'));
    patchPostInCaches(queryClient, 'b', addLike);
    expect(queryClient.getQueryData(queryKeys.posts.list()).posts[0].likes).toHaveLength(0);
    expect(queryClient.getQueryData(queryKeys.posts.detail('a')).post).toBe(detailA.post);
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
    expect(queryClient.getQueryData(queryKeys.posts.detail('b')).post.likes).toHaveLength(1);
    restorePostCaches(queryClient, snapshot);
    expect(queryClient.getQueryData(queryKeys.posts.detail('b')).post.likes).toHaveLength(0);
    expect(queryClient.getQueryData(queryKeys.posts.list()).posts[1].likes).toHaveLength(0);
    expect(queryClient.getQueryData(queryKeys.users.posts('u1')).posts[0].likes).toHaveLength(0);
  });
});
