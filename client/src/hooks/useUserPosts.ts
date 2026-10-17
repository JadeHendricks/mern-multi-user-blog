import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { useErrorToast } from './useErrorToast';

/** Every post written by one user. @param {string} id The author's id. */
export const useUserPosts = (id) => {
  const query = useQuery({
    queryKey: queryKeys.users.posts(id),
    queryFn: ({ signal }) => api.get(`/api/post/user/${id}`, { signal }),
    select: (data) => data.posts,
  });
  useErrorToast(query.error);
  return query;
};