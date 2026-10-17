import { QueryClient } from '@tanstack/react-query';

// Retry once, and only when a retry can help: the network failed (status 0) or the server broke (5xx).
// A 4xx answer (wrong password, missing post) would give the same answer again.
/** @param {number} failureCount @param {{ status?: number }} error */
export const shouldRetry = (failureCount, error) =>
  failureCount < 1 && typeof error?.status === 'number' && (error.status === 0 || error.status >= 500);

/** @param {{ retry?: boolean | typeof shouldRetry }} [overrides] */
export const createQueryClient = ({ retry = shouldRetry } = {}) =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Nothing refetched on focus before Query, and it would move screenshots.
        refetchOnWindowFocus: false,
        retry,
      },
    },
  });

export const queryClient = createQueryClient();
