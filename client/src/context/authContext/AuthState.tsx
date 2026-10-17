import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from '@mern-blog/shared';
import AuthContext from './AuthContext';
import type { AuthContextValue } from './AuthContext';
import { useMe } from '../../hooks/useMe';
import { api } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';

// Same helper as before; it does not depend on state, so it lives outside the component and keeps
// one identity for the whole session.
const isUsersData = (
  loggedInUserId: string | null | undefined,
  userId: string | null | undefined,
): boolean | undefined => {
  if (loggedInUserId && userId) {
    return loggedInUserId === userId;
  }
  return undefined;
};

// The api only rejects with an ApiError or an AbortError, both Errors. The fallback keeps the
// handlers total without changing what a real failure shows.
const messageOf = (err: unknown): string =>
  err instanceof Error ? err.message : 'Request failed';

interface AuthStateProps {
  children: ReactNode;
}

const AuthState = ({ children }: AuthStateProps): ReactElement => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me, isPending } = useMe();

  // useNavigate changes identity when the location changes. Callbacks read it through a ref so
  // they stay stable and consumers do not re-render on every navigation.
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  });

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        const body: LoginRequest = { email, password };
        const res = await api.post<LoginResponse>('/api/auth/login', { body });
        queryClient.setQueryData(queryKeys.me, res.user);
        toast.success('Login successful, welcome to the Multi User Blog.');
        void navigateRef.current('/');
      } catch (err) {
        toast.error(messageOf(err));
      }
    },
    [queryClient],
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<void> => {
      try {
        const body: RegisterRequest = { name, email, password };
        const res = await api.post<MessageResponse>('/api/auth/register', { body });
        toast.success(res.message);
      } catch (err) {
        toast.error(messageOf(err));
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    let res: MessageResponse | undefined;
    try {
      res = await api.post<MessageResponse>('/api/auth/logout');
      toast.success('Logging out');
    } catch {
      // Same as before: a failed logout request still leaves the page logged out, without a toast.
    }
    // Everything cached belongs to the signed-in user, so none of it may outlive the session.
    queryClient.clear();
    queryClient.setQueryData(queryKeys.me, null);
    if (res?.message === 'success') {
      void navigateRef.current('/login');
    }
  }, [queryClient]);

  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    try {
      const body: ForgotPasswordRequest = { email };
      const res = await api.put<MessageResponse>('/api/auth/forgot-password', { body });
      toast.success(res.message);
    } catch (err) {
      toast.error(messageOf(err));
    }
  }, []);

  const resetPassword = useCallback(async (newPassword: string, token: string): Promise<void> => {
    try {
      const body: ResetPasswordRequest = { newPassword, resetPasswordLink: token };
      const res = await api.put<MessageResponse>('/api/auth/reset-password', { body });
      toast.success(res.message);
      // The toast lives in the shell, so it survives the navigation.
      void navigateRef.current('/login');
    } catch (err) {
      toast.error(messageOf(err));
    }
  }, []);

  const activateAccount = useCallback(async (token: string): Promise<void> => {
    try {
      const res = await api.post<MessageResponse>('/api/auth/account-activation', {
        body: { token },
      });
      toast.success(res.message);
      void navigateRef.current('/login');
    } catch (err) {
      toast.error(messageOf(err));
    }
  }, []);

  // null while the first answer is pending, so Loader and RequireAuth wait instead of guessing.
  // A failed request counts as logged out, like the old AUTH_ERROR did.
  const loggedInUser = me ?? null;
  const isAuthenticated = isPending ? null : Boolean(me);

  // One memoized value: consumers re-render when the session changes, not when a parent does.
  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      authLoading: isPending,
      loggedInUser,
      register,
      login,
      logout,
      resetPassword,
      forgotPassword,
      activateAccount,
      isUsersData,
    }),
    [
      isAuthenticated,
      isPending,
      loggedInUser,
      register,
      login,
      logout,
      resetPassword,
      forgotPassword,
      activateAccount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthState;
