import { useQuery } from '@tanstack/react-query';
import type { PublicUserResponse } from '@mern-blog/shared';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { useErrorToast } from './useErrorToast';

/** One user's public profile. */
export const useUser = (id: string) => {
  const query = useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: ({ signal }) => api.get<PublicUserResponse>(`/api/user/${id}`, { signal }),
    select: (data) => data.user,
  });
  useErrorToast(query.error);
  return query;
};
