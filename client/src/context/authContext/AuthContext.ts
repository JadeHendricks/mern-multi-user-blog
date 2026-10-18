import { createContext, useContext } from 'react';
import type { OwnUserDto } from '@mern-blog/shared';

export interface AuthContextValue {
  /** null while the first answer is pending. */
  isAuthenticated: boolean | null;
  authLoading: boolean;
  loggedInUser: OwnUserDto | null;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (newPassword: string, token: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  activateAccount: (token: string) => Promise<void>;
  /** Undefined when either id is missing. */
  isUsersData: (
    loggedInUserId: string | null | undefined,
    userId: string | null | undefined,
  ) => boolean | undefined;
}

const authContext = createContext<AuthContextValue | undefined>(undefined);

/** The session state. Only works below <AuthState>. */
export function useAuth(): AuthContextValue {
  const value = useContext(authContext);
  if (!value) throw new Error('useAuth must be used inside <AuthState>');
  return value;
}

export default authContext;
