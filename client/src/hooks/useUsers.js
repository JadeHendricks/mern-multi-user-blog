import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { useErrorToast } from './useErrorToast';

// Every public user profile, unpaginated for now.
export const useUsers = () => {
  const query = useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: ({ signal }) => api.get('/api/user', { signal }),
    select: (data) => data.users,
  });
  useErrorToast(query.error);
  return query;
};