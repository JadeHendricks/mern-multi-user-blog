import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import type { PostWithAuthor } from './types';

// A post lives in several caches at once: the feed (flat list), infinite pages, the post page and
// a profile's post list. A like or a comment has to show up in all of them, so mutations patch
// through here instead of touching one cache.

/** Receives the cached post, returns the new one. */
export type PostUpdater = (post: PostWithAuthor) => PostWithAuthor;

/** Every post cache as it was: what a failed mutation puts back. */
export type PostCacheSnapshot = [QueryKey, unknown][];

/** Cache prefixes that can hold a post. */
const postKeys = (): QueryKey[] => [queryKeys.posts.all, queryKeys.users.postsAll()];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// Only payloads typed by the api wrapper are ever cached under the post keys, so a record with an
// `_id` is a post.
const isPost = (value: unknown): value is PostWithAuthor =>
  isRecord(value) && typeof value._id === 'string';

/** Applies `updater` to every copy of the post in a cached value. Unknown shapes come back as is. */
const patchData = (data: unknown, postId: string, updater: PostUpdater): unknown => {
  if (!isRecord(data)) return data;
  const patch = (post: unknown): unknown =>
    isPost(post) && post._id === postId ? updater(post) : post;
  // useInfiniteQuery: { pages: [{ posts, nextCursor }], pageParams }
  if (Array.isArray(data.pages)) {
    const pages: unknown[] = data.pages;
    return {
      ...data,
      pages: pages.map((page) =>
        isRecord(page) && Array.isArray(page.posts)
          ? { ...page, posts: (page.posts as unknown[]).map(patch) }
          : page,
      ),
    };
  }
  // Flat list: { posts }
  if (Array.isArray(data.posts)) return { ...data, posts: (data.posts as unknown[]).map(patch) };
  // Post page: { post }
  if (data.post) return { ...data, post: patch(data.post) };
  return data;
};

export const patchPostInCaches = (
  queryClient: QueryClient,
  postId: string,
  updater: PostUpdater,
): void => {
  for (const queryKey of postKeys()) {
    queryClient.setQueriesData({ queryKey }, (data: unknown) => patchData(data, postId, updater));
  }
};

/**
 * Stops in-flight refetches (they would overwrite an optimistic patch) and remembers every post
 * cache so a failed mutation can put it back.
 */
export const snapshotPostCaches = async (queryClient: QueryClient): Promise<PostCacheSnapshot> => {
  await Promise.all(postKeys().map((queryKey) => queryClient.cancelQueries({ queryKey })));
  return postKeys().flatMap((queryKey) => queryClient.getQueriesData({ queryKey }));
};

export const restorePostCaches = (queryClient: QueryClient, snapshot: PostCacheSnapshot): void => {
  for (const [queryKey, data] of snapshot) queryClient.setQueryData(queryKey, data);
};
