import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { PostDetailPayload } from '../lib/types';
import { useErrorToast } from './useErrorToast';

/** One post by id. */
export const usePost = (id: string) => {
  const query = useQuery({
    queryKey: queryKeys.posts.detail(id),
    queryFn: ({ signal }) => api.get<PostDetailPayload>(`/api/post/${id}`, { signal }),
    select: (data) => data.post,
  });
  useErrorToast(query.error);
  return query;
};
