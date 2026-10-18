import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import AuthContext from '../../context/authContext/AuthContext';
import RequireAuth from './RequireAuth';
import { testAuth } from '../../testing/testAuth';
import type { TestAuth } from '../../testing/testAuth';

const Secret = () => <div>secret page</div>;

const renderAt = (auth: TestAuth) =>
  render(
    <AuthContext.Provider value={testAuth(auth)}>
      <MemoryRouter initialEntries={['/secret']}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/secret" element={<Secret />} />
          </Route>
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('RequireAuth', () => {
  it('shows the loader while the session is being checked', () => {
    const { container, queryByText } = renderAt({ isAuthenticated: null, authLoading: true });
    expect(container.querySelector('.loader__spinner')).not.toBeNull();
    expect(queryByText('secret page')).toBeNull();
    expect(queryByText('login page')).toBeNull();
  });

  it('redirects to /login when unauthenticated', () => {
    const { queryByText } = renderAt({ isAuthenticated: false, authLoading: false });
    expect(queryByText('login page')).not.toBeNull();
    expect(queryByText('secret page')).toBeNull();
  });

  it('renders the component when authenticated', () => {
    const { queryByText } = renderAt({ isAuthenticated: true, authLoading: false });
    expect(queryByText('secret page')).not.toBeNull();
  });
});
