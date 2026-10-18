import { useInfiniteQuery } from '@tanstack/react-query';
import type { PublicUserDto } from '@mern-blog/shared';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { UserListPayload } from '../lib/types';
import { useErrorToast } from './useErrorToast';

export const USERS_PAGE_SIZE = 12;

// Public user profiles, 12 per page. `users` is every loaded page flattened.
export const useUsers = () => {
  // The page param is the cursor; undefined asks for the first page.
  const query = useInfiniteQuery<
    UserListPayload,
    Error,
    PublicUserDto[],
    ReturnType<typeof queryKeys.users.list>,
    string | undefined
  >({
    queryKey: queryKeys.users.list({ limit: USERS_PAGE_SIZE }),
    initialPageParam: undefined,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams({ limit: String(USERS_PAGE_SIZE) });
      if (pageParam) params.set('cursor', pageParam);
      return api.get<UserListPayload>(`/api/user?${params.toString()}`, { signal });
    },
    // undefined (not null) is what tells Query there is no next page.
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.users),
  });
  // Also covers a failed "Load more": the loaded pages stay, the toast explains.
  useErrorToast(query.error);
  return query;
};
