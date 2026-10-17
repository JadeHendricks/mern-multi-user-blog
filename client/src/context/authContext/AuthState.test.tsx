import React, { useContext, useEffect, useState } from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import AuthContext from './AuthContext';
import AuthState from './AuthState';
import ActivateAccount from '../../components/auth/local/ActivateAccount';
import { createQueryClient } from '../../lib/queryClient';
import { queryKeys } from '../../lib/queryKeys';
import { mockApi } from '../../testing/mockApi';
import { renderWithProviders } from '../../testing/renderWithProviders';

const ann = { _id: 'u1', name: 'Ann', email: 'ann@test.dev', avatar: 'a.png' };

// The latest context value, handed to the test body from an effect.
let auth;
const Probe = () => {
  const ctx = useContext(AuthContext);
  useEffect(() => {
    auth = ctx;
  });
  const { pathname } = useLocation();
  return (
    <div>
      <span data-testid="state">
        {String(ctx.isAuthenticated)}|{String(ctx.authLoading)}|{ctx.loggedInUser?.name ?? 'nobody'}
      </span>
      <span data-testid="path">{pathname}</span>
    </div>
  );
};

beforeEach(() => {
  vi.spyOn(toast, 'success').mockImplementation(() => 0);
  vi.spyOn(toast, 'error').mockImplementation(() => 0);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const state = () => screen.getByTestId('state').textContent;

describe('AuthState with useMe', () => {
  it('is unknown (null, loading) until /api/user/me answers, then signed in', async () => {
    let answer;
    mockApi({ 'GET /api/user/me': () => new Promise((resolve) => (answer = resolve)) });
    renderWithProviders(<Probe />);
    expect(state()).toBe('null|true|nobody');
    await act(async () => answer({ body: { user: ann } }));
    await waitFor(() => expect(state()).toBe('true|false|Ann'));
  });

  it('treats a 401 as a visitor: no toast, no extra isloggedin request', async () => {
    const api = mockApi({ 'GET /api/user/me': { status: 401, body: { message: 'You are not logged in!' } } });
    renderWithProviders(<Probe />);
    await waitFor(() => expect(state()).toBe('false|false|nobody'));
    expect(toast.error).not.toHaveBeenCalled();
    expect(api.calls.map((c) => `${c.method} ${c.path}`)).toEqual(['GET /api/user/me']);
  });

  it('counts a server failure as logged out as well', async () => {
    mockApi({ 'GET /api/user/me': { status: 400, body: { message: 'User not found!' } } });
    renderWithProviders(<Probe />);
    await waitFor(() => expect(state()).toBe('false|false|nobody'));
  });
});

describe('AuthState actions', () => {
  it('logs in: posts the credentials, shows the user, toasts and goes home', async () => {
    const api = mockApi({
      'GET /api/user/me': { status: 401, body: { message: 'no' } },
      'POST /api/auth/login': { body: { user: ann } },
    });
    renderWithProviders(<Probe />, { route: '/login' });
    await waitFor(() => expect(state()).toBe('false|false|nobody'));
    await act(async () => auth.login('ann@test.dev', 'secret12'));
    expect(api.callsTo('POST /api/auth/login')[0].body).toEqual({ email: 'ann@test.dev', password: 'secret12' });
    expect(toast.success).toHaveBeenCalledWith('Login successful, welcome to the Multi User Blog.');
    await waitFor(() => expect(state()).toBe('true|false|Ann'));
    expect(screen.getByTestId('path')).toHaveTextContent('/');
  });

  it('shows the server message when the login fails and stays on the page', async () => {
    mockApi({
      'GET /api/user/me': { status: 401, body: { message: 'no' } },
      'POST /api/auth/login': { status: 401, body: { message: 'Incorrect email or password' } },
    });
    renderWithProviders(<Probe />, { route: '/login' });
    await waitFor(() => expect(state()).toBe('false|false|nobody'));
    await act(async () => auth.login('ann@test.dev', 'nope'));
    expect(toast.error).toHaveBeenCalledWith('Incorrect email or password');
    expect(toast.success).not.toHaveBeenCalled();
    expect(state()).toBe('false|false|nobody');
    expect(screen.getByTestId('path')).toHaveTextContent('/login');
  });

  it('logs out with POST, clears the whole cache and goes to /login', async () => {
    const api = mockApi({
      'GET /api/user/me': { body: { user: ann } },
      'POST /api/auth/logout': { body: { message: 'success' } },
    });
    const queryClient = createQueryClient({ retry: false });
    queryClient.setQueryData(queryKeys.posts.list(), { posts: [{ _id: 'p1' }] });
    renderWithProviders(<Probe />, { queryClient, route: '/profile/u1' });
    await waitFor(() => expect(state()).toBe('true|false|Ann'));
    await act(async () => auth.logout());
    expect(api.callsTo('POST /api/auth/logout')).toHaveLength(1);
    expect(api.calls.some((c) => c.method === 'GET' && c.path === '/api/auth/logout')).toBe(false);
    expect(toast.success).toHaveBeenCalledWith('Logging out');
    expect(queryClient.getQueryData(queryKeys.posts.list())).toBeUndefined();
    await waitFor(() => expect(state()).toBe('false|false|nobody'));
    expect(screen.getByTestId('path')).toHaveTextContent('/login');
    // Cleared means cleared: the signed-in user is not fetched again by accident.
    expect(api.callsTo('GET /api/user/me')).toHaveLength(1);
  });

  it('toasts the server message for register, forgot and reset, and goes to /login after a reset', async () => {
    mockApi({
      'GET /api/user/me': { status: 401, body: { message: 'no' } },
      'POST /api/auth/register': { body: { message: 'Email has been sent to a@b.co.' } },
      'PUT /api/auth/forgot-password': { body: { message: 'Reset mail sent' } },
      'PUT /api/auth/reset-password': { body: { message: 'Password has been updated, Login!' } },
    });
    renderWithProviders(<Probe />, { route: '/auth/password/reset/tok' });
    await waitFor(() => expect(state()).toBe('false|false|nobody'));
    await act(async () => auth.register('Ann', 'a@b.co', 'secret12'));
    expect(toast.success).toHaveBeenLastCalledWith('Email has been sent to a@b.co.');
    await act(async () => auth.forgotPassword('a@b.co'));
    expect(toast.success).toHaveBeenLastCalledWith('Reset mail sent');
    await act(async () => auth.resetPassword('newsecret', 'tok'));
    expect(toast.success).toHaveBeenLastCalledWith('Password has been updated, Login!');
    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/login'));
  });

  it('activates the account, toasts and goes to /login; an error toasts its message', async () => {
    const api = mockApi({
      'GET /api/user/me': { status: 401, body: { message: 'no' } },
      'POST /api/auth/account-activation': { status: 201, body: { message: 'Activation successful. Please login.' } },
    });
    renderWithProviders(<Probe />, { route: '/auth/activate/tok' });
    await waitFor(() => expect(state()).toBe('false|false|nobody'));
    await act(async () => auth.activateAccount('tok'));
    expect(api.callsTo('POST /api/auth/account-activation')[0].body).toEqual({ token: 'tok' });
    expect(toast.success).toHaveBeenCalledWith('Activation successful. Please login.');
    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/login'));

    api.set('POST /api/auth/account-activation', { status: 409, body: { message: 'Account is already activated' } });
    await act(async () => auth.activateAccount('tok'));
    expect(toast.error).toHaveBeenCalledWith('Account is already activated');
  });
});

// B22: the old provider built a new value object on every render, so every consumer re-rendered
// whenever anything above the provider re-rendered.
describe('AuthState value stability (B22)', () => {
  it('does not re-render consumers when an unrelated parent re-renders', async () => {
    mockApi({ 'GET /api/user/me': { body: { user: ann } } });
    // Counts the commits in which Consumer rendered (an effect without dependencies runs after each).
    let renders = 0;
    const Consumer = () => {
      const { loggedInUser } = useContext(AuthContext);
      useEffect(() => {
        renders += 1;
      });
      return <span>{loggedInUser ? 'in' : 'out'}</span>;
    };
    // Same element every time, so only the context value can make Consumer render again.
    const child = <Consumer />;
    const Parent = () => {
      const [n, setN] = useState(0);
      return (
        <>
          <button onClick={() => setN(n + 1)}>bump {n}</button>
          <AuthState>{child}</AuthState>
        </>
      );
    };
    render(
      <QueryClientProvider client={createQueryClient({ retry: false })}>
        <MemoryRouter>
          <Parent />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await screen.findByText('in');
    const before = renders;
    fireEvent.click(screen.getByText('bump 0'));
    expect(screen.getByText('bump 1')).toBeInTheDocument();
    expect(renders).toBe(before);
  });
});

describe('ActivateAccount', () => {
  it('asks for the greeting once under StrictMode and shows the first name', async () => {
    const api = mockApi({
      'GET /api/user/me': { status: 401, body: { message: 'no' } },
      'GET /api/auth/account-activation/tok-1': { body: { name: 'Ann Lee' } },
    });
    renderWithProviders(
      <React.StrictMode>
        <ActivateAccount />
      </React.StrictMode>,
      { route: '/auth/activate/tok-1', path: '/auth/activate/:token' },
    );
    await screen.findByText(/Hello Ann, activate your account now!/);
    expect(api.callsTo('GET /api/auth/account-activation/tok-1')).toHaveLength(1);
  });

  it('keeps a generic greeting without a toast when the lookup fails', async () => {
    mockApi({
      'GET /api/user/me': { status: 401, body: { message: 'no' } },
      'GET /api/auth/account-activation/gone': { status: 404, body: { message: 'Not found' } },
    });
    renderWithProviders(<ActivateAccount />, { route: '/auth/activate/gone', path: '/auth/activate/:token' });
    await waitFor(() => expect(screen.getByRole('heading', { name: /activate your account now!/ })).toBeInTheDocument());
    expect(screen.getByRole('heading')).toHaveTextContent('Hello , activate your account now!');
    expect(toast.error).not.toHaveBeenCalled();
  });
});
