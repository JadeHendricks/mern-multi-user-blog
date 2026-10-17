import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { createQueryClient } from '../lib/queryClient';
import { mockApi } from '../testing/mockApi';
import { useMe } from './useMe';
import { useErrorToast } from './useErrorToast';

vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const withQuery = () => {
  const client = createQueryClient({ retry: false });
  const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return wrapper;
};

describe('useMe', () => {
  it('resolves to the user from /api/user/me', async () => {
    mockApi({ 'GET /api/user/me': { body: { user: { _id: 'u1', name: 'Alice' } } } });
    const { result } = renderHook(() => useMe(), { wrapper: withQuery() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ _id: 'u1', name: 'Alice' });
  });

  it('resolves to null for a visitor (401) instead of an error', async () => {
    const api = mockApi({ 'GET /api/user/me': { status: 401, body: { message: 'Please log in' } } });
    const { result } = renderHook(() => useMe(), { wrapper: withQuery() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(api.callsTo('GET /api/user/me')).toHaveLength(1);
  });

  it('keeps any other failure as an error', async () => {
    mockApi({ 'GET /api/user/me': { status: 500, body: { message: 'Something went wrong' } } });
    const { result } = renderHook(() => useMe(), { wrapper: withQuery() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ status: 500, message: 'Something went wrong' });
  });
});

describe('useErrorToast', () => {
  it('toasts the message once per error object, not on every render', () => {
    const error = new Error('Could not load');
    const { rerender } = renderHook(({ err }) => useErrorToast(err), { initialProps: { err: error } });
    rerender({ err: error });
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Could not load');
  });

  it('stays quiet without an error', () => {
    renderHook(() => useErrorToast(null));
    expect(toast.error).not.toHaveBeenCalled();
  });
});
