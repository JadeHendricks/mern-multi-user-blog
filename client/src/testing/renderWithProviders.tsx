import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import AuthContext from '../context/authContext/AuthContext';
import AuthState from '../context/authContext/AuthState';
import { createQueryClient } from '../lib/queryClient';

// Renders `ui` the way App does: Query, router and auth around it.
// - route: the URL to start on (or a history array with index as the current entry).
//   path: the route pattern `ui` is mounted on (for useParams).
// - auth: a fixed AuthContext value. Leave it out to use the real AuthState (which asks /api/user/me).
// - queryClient: pass one to inspect or pre-fill the cache. Retries are off, so a failure shows at once.
/**
 * @param {React.ReactElement} ui
 * @param {{ route?: string | string[], index?: number, path?: string, auth?: object, queryClient?: import('@tanstack/react-query').QueryClient }} [options]
 */
export const renderWithProviders = (
  ui,
  { route = '/', index, path, auth, queryClient = createQueryClient({ retry: false }) } = {},
) => {
  const page = path ? (
    <Routes>
      <Route path={path} element={ui} />
    </Routes>
  ) : (
    ui
  );
  const withAuth = auth ? <AuthContext.Provider value={auth}>{page}</AuthContext.Provider> : <AuthState>{page}</AuthState>;
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route].flat()} initialIndex={index}>{withAuth}</MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, queryClient };
};
