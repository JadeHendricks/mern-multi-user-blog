import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import AuthContext from './AuthContext';
import { useMe } from '../../hooks/useMe';
import { api } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';

// Same helper as before; it does not depend on state, so it lives outside the component and keeps
// one identity for the whole session.
const isUsersData = (loggedInUserId, userId) => {
  if (loggedInUserId && userId) {
      return loggedInUserId === userId;
  }
}

const AuthState = ({ children }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me, isPending } = useMe();

  // useNavigate changes identity when the location changes. Callbacks read it through a ref so
  // they stay stable and consumers do not re-render on every navigation.
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  });

  const login = useCallback(async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { body: { email, password } });
      queryClient.setQueryData(queryKeys.me, res.user);
      toast.success('Login successful, welcome to the Multi User Blog.');
      navigateRef.current('/');
    } catch (err) {
      toast.error(err.message);
    }
  }, [queryClient]);

  const register = useCallback(async (name, email, password) => {
    try {
      const res = await api.post('/api/auth/register', { body: { name, email, password } });
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const logout = useCallback(async () => {
    let res;
    try {
      res = await api.post('/api/auth/logout');
      toast.success('Logging out');
    } catch (err) {
      // Same as before: a failed logout request still leaves the page logged out, without a toast.
    }
    // Everything cached belongs to the signed-in user, so none of it may outlive the session.
    queryClient.clear();
    queryClient.setQueryData(queryKeys.me, null);
    if (res?.message === 'success') {
      navigateRef.current('/login');
    }
  }, [queryClient]);

  const forgotPassword = useCallback(async (email) => {
    try {
      const res = await api.put('/api/auth/forgot-password', { body: { email } });
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const resetPassword = useCallback(async (newPassword, token) => {
    try {
      const res = await api.put('/api/auth/reset-password', { body: { newPassword, resetPasswordLink: token } });
      toast.success(res.message);
      // The toast lives in the shell, so it survives the navigation.
      navigateRef.current('/login');
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const activateAccount = useCallback(async (token) => {
    try {
      const res = await api.post('/api/auth/account-activation', { body: { token } });
      toast.success(res.message);
      navigateRef.current('/login');
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  // null while the first answer is pending, so Loader and RequireAuth wait instead of guessing.
  // A failed request counts as logged out, like the old AUTH_ERROR did.
  const loggedInUser = me ?? null;
  const isAuthenticated = isPending ? null : Boolean(me);

  // One memoized value: consumers re-render when the session changes, not when a parent does.
  const value = useMemo(() => ({
    isAuthenticated,
    authLoading: isPending,
    loggedInUser,
    register,
    login,
    logout,
    resetPassword,
    forgotPassword,
    activateAccount,
    isUsersData
  }), [isAuthenticated, isPending, loggedInUser, register, login, logout, resetPassword, forgotPassword, activateAccount]);

  return (
    <AuthContext.Provider value={ value }>
      { children }
    </AuthContext.Provider>
  )
}

export default AuthState;
