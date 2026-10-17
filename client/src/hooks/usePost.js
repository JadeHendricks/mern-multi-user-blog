import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { useErrorToast } from './useErrorToast';

/** One post by id. @param {string} id */
export const usePost = (id) => {
  const query = useQuery({
    queryKey: queryKeys.posts.detail(id),
    queryFn: ({ signal }) => api.get(`/api/post/${id}`, { signal }),
    select: (data) => data.post,
  });
  useErrorToast(query.error);
  return query;
};