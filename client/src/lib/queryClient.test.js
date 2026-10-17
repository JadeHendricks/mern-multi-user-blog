import { createQueryClient, shouldRetry } from './queryClient';

describe('queryClient defaults', () => {
  it('uses a 30s stale time and does not refetch on window focus', () => {
    const { queries } = createQueryClient().getDefaultOptions();
    expect(queries.staleTime).toBe(30_000);
    expect(queries.refetchOnWindowFocus).toBe(false);
  });

  it('retries once, and only for network and server errors', () => {
    expect(shouldRetry(0, { status: 0 })).toBe(true);
    expect(shouldRetry(0, { status: 503 })).toBe(true);
    expect(shouldRetry(1, { status: 503 })).toBe(false);
    expect(shouldRetry(0, { status: 401 })).toBe(false);
    expect(shouldRetry(0, { status: 404 })).toBe(false);
    expect(shouldRetry(0, new Error('boom'))).toBe(false);
  });

  it('lets tests turn retries off', () => {
    expect(createQueryClient({ retry: false }).getDefaultOptions().queries.retry).toBe(false);
  });
});
