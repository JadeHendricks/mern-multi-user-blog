import { QueryClient } from '@tanstack/react-query';

// Query's error type is not narrowed to ApiError: a failed request can also be an AbortError or a
// TypeError, so the check looks at the shape instead.
const hasStatus = (error: unknown): error is { status: number } =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof error.status === 'number';

// Retry once, and only when a retry can help: the network failed (status 0) or the server broke (5xx).
// A 4xx answer (wrong password, missing post) would give the same answer again.
export const shouldRetry = (failureCount: number, error: unknown): boolean =>
  failureCount < 1 && hasStatus(error) && (error.status === 0 || error.status >= 500);

export const createQueryClient = ({
  retry = shouldRetry,
}: { retry?: boolean | typeof shouldRetry } = {}): QueryClient =>
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
