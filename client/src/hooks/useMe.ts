import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

// The signed-in user, or null for a visitor. One request answers both questions: "am I logged in?"
// and "who am I?". A 401 is the normal answer for a visitor, so it resolves to null instead of an
// error (no toast, no retry). Any other failure stays an error.
export const useMe = () =>
  useQuery({
    queryKey: queryKeys.me,
    queryFn: async ({ signal }) => {
      try {
        const res = await api.get('/api/user/me', { signal });
        return res.user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
  });
