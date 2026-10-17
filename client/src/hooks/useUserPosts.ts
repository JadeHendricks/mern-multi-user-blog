import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { PostListPayload } from '../lib/types';
import { useErrorToast } from './useErrorToast';

/** Every post written by one user (`id` is the author's id). */
export const useUserPosts = (id: string) => {
  const query = useQuery({
    queryKey: queryKeys.users.posts(id),
    queryFn: ({ signal }) => api.get<PostListPayload>(`/api/post/user/${id}`, { signal }),
    select: (data) => data.posts,
  });
  useErrorToast(query.error);
  return query;
};
