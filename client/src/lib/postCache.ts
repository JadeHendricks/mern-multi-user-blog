import { queryKeys } from './queryKeys';

// A post lives in several caches at once: the feed (flat list), infinite pages, the post page and
// a profile's post list. A like or a comment has to show up in all of them, so mutations patch
// through here instead of touching one cache.

/** Cache prefixes that can hold a post. */
const postKeys = () => [queryKeys.posts.all, queryKeys.users.postsAll()];

/**
 * Applies `updater` to every copy of the post in a cached value. Unknown shapes come back as is.
 * @param {any} data
 * @param {string} postId
 * @param {(post: any) => any} updater
 */
const patchData = (data, postId, updater) => {
  if (!data || typeof data !== 'object') return data;
  const patch = (post) => (post?._id === postId ? updater(post) : post);
  // useInfiniteQuery: { pages: [{ posts, nextCursor }], pageParams }
  if (Array.isArray(data.pages)) {
    return {
      ...data,
      pages: data.pages.map((page) =>
        Array.isArray(page?.posts) ? { ...page, posts: page.posts.map(patch) } : page,
      ),
    };
  }
  // Flat list: { posts }
  if (Array.isArray(data.posts)) return { ...data, posts: data.posts.map(patch) };
  // Post page: { post }
  if (data.post) return { ...data, post: patch(data.post) };
  return data;
};

/**
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string} postId
 * @param {(post: any) => any} updater Receives the cached post, returns the new one.
 */
export const patchPostInCaches = (queryClient, postId, updater) => {
  for (const queryKey of postKeys()) {
    queryClient.setQueriesData({ queryKey }, (data) => patchData(data, postId, updater));
  }
};

/**
 * Stops in-flight refetches (they would overwrite an optimistic patch) and remembers every post
 * cache so a failed mutation can put it back.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 */
export const snapshotPostCaches = async (queryClient) => {
  await Promise.all(postKeys().map((queryKey) => queryClient.cancelQueries({ queryKey })));
  return postKeys().flatMap((queryKey) => queryClient.getQueriesData({ queryKey }));
};

/**
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {Array<[import('@tanstack/react-query').QueryKey, unknown]>} snapshot
 */
export const restorePostCaches = (queryClient, snapshot) => {
  for (const [queryKey, data] of snapshot) queryClient.setQueryData(queryKey, data);
};
