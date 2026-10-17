import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { useErrorToast } from './useErrorToast';

// Every post, unpaginated. The home feed and the popular page share this one cache entry. The raw
// { posts } response is cached (the cache patcher knows that shape); `posts` is selected from it.
export const usePosts = () => {
  const query = useQuery({
    queryKey: queryKeys.posts.list(),
    queryFn: ({ signal }) => api.get('/api/post', { signal }),
    select: (data) => data.posts,
  });
  useErrorToast(query.error);
  return query;
};