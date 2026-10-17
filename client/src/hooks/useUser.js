import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { useErrorToast } from './useErrorToast';

/** One user's public profile. @param {string} id */
export const useUser = (id) => {
  const query = useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: ({ signal }) => api.get(`/api/user/${id}`, { signal }),
    select: (data) => data.user,
  });
  useErrorToast(query.error);
  return query;
};