import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import AuthContext from '../../context/authContext/AuthContext';
import PrivateRoute from './PrivateRoute';

const Secret = () => <div>secret page</div>;

const renderAt = auth =>
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={['/secret']}>
        <PrivateRoute path="/secret" component={Secret} />
        <Route path="/login" render={() => <div>login page</div>} />
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('PrivateRoute', () => {
  it('shows the loader while the session is being checked', () => {
    const { container, queryByText } = renderAt({ isAuthenticated: null, authLoading: true });
    expect(container.querySelector('.loader')).not.toBeNull();
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
