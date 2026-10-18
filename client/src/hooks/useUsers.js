import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { useErrorToast } from './useErrorToast';

export const USERS_PAGE_SIZE = 12;

// Public user profiles, 12 per page. `users` is every loaded page flattened.
export const useUsers = () => {
  const query = useInfiniteQuery({
    queryKey: queryKeys.users.list({ limit: USERS_PAGE_SIZE }),
    initialPageParam: /** @type {string | undefined} */ (undefined),
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams({ limit: String(USERS_PAGE_SIZE) });
      if (pageParam) params.set('cursor', pageParam);
      return api.get(`/api/user?${params}`, { signal });
    },
    // undefined (not null) is what tells Query there is no next page.
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.users),
  });
  // Also covers a failed "Load more": the loaded pages stay, the toast explains.
  useErrorToast(query.error);
  return query;
};
