import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { PostListPayload, PostWithAuthor } from '../lib/types';
import { useErrorToast } from './useErrorToast';

export const FEED_PAGE_SIZE = 12;

// The home feed, 12 posts per page. Each cached page is the raw { posts, nextCursor } response
// (the cache patcher knows that shape); `posts` is every loaded page flattened. Most popular
// posts keep their own unpaginated usePosts query because they sort the whole set.
export const usePostsInfinite = () => {
  // The page param is the cursor; undefined asks for the first page.
  const query = useInfiniteQuery<
    PostListPayload,
    Error,
    PostWithAuthor[],
    ReturnType<typeof queryKeys.posts.list>,
    string | undefined
  >({
    queryKey: queryKeys.posts.list({ limit: FEED_PAGE_SIZE }),
    initialPageParam: undefined,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams({ limit: String(FEED_PAGE_SIZE) });
      if (pageParam) params.set('cursor', pageParam);
      return api.get<PostListPayload>(`/api/post?${params.toString()}`, { signal });
    },
    // undefined (not null) is what tells Query there is no next page.
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.posts),
  });
  // Also covers a failed "Load more": the loaded pages stay, the toast explains.
  useErrorToast(query.error);
  return query;
};
