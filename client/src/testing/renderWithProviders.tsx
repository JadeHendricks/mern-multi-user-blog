import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import AuthContext from '../context/authContext/AuthContext';
import AuthState from '../context/authContext/AuthState';
import { createQueryClient } from '../lib/queryClient';
import { testAuth } from './testAuth';
import type { TestAuth } from './testAuth';

export interface RenderOptions {
  /** The URL to start on, or a history array with `index` as the current entry. */
  route?: string | string[];
  index?: number;
  /** The route pattern `ui` is mounted on (for useParams). */
  path?: string;
  /** A fixed AuthContext value. Leave it out to use the real AuthState (which asks /api/user/me). */
  auth?: TestAuth;
  /** Pass one to inspect or pre-fill the cache. Retries are off, so a failure shows at once. */
  queryClient?: QueryClient;
}

// Renders `ui` the way App does: Query, router and auth around it.
export const renderWithProviders = (
  ui: ReactElement,
  { route = '/', index, path, auth, queryClient = createQueryClient({ retry: false }) }: RenderOptions = {},
) => {
  const page = path ? (
    <Routes>
      <Route path={path} element={ui} />
    </Routes>
  ) : (
    ui
  );
  const withAuth = auth ? (
    <AuthContext.Provider value={testAuth(auth)}>{page}</AuthContext.Provider>
  ) : (
    <AuthState>{page}</AuthState>
  );
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route].flat()} {...(index === undefined ? {} : { initialIndex: index })}>
        {withAuth}
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, queryClient };
};
