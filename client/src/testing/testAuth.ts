import type { OwnUserDto } from '@mern-blog/shared';
import type { AuthContextValue } from '../context/authContext/AuthContext';

/**
 * What a test gives for the session: only the fields the component under test reads, and a user with
 * only the fields it shows. A component that reads anything else gets undefined and the test fails.
 */
export type TestAuth = Partial<Omit<AuthContextValue, 'loggedInUser'>> & {
  loggedInUser?: Partial<OwnUserDto> | null;
};

// The one place a partial test value becomes a full context value (see TestAuth).
export const testAuth = (auth: TestAuth): AuthContextValue => auth as AuthContextValue;
