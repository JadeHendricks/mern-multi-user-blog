import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import AuthContext from '../../../context/authContext/AuthContext';
import Login from './Login';

// Login has no client-side validation (the API validates), so this asserts that submit passes the
// typed values to the context's login method.
describe('Login form', () => {
  afterEach(cleanup);

  it('passes the typed email and password to login on submit', () => {
    const login = vi.fn();
    const { getByLabelText, getByText } = render(
      <AuthContext.Provider value={{ login, isAuthenticated: false, loggedInUser: null }}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    fireEvent.change(getByLabelText('Email address'), { target: { name: 'email', value: 'a@b.co' } });
    fireEvent.change(getByLabelText('Password'), { target: { name: 'password', value: 'secret12' } });
    fireEvent.click(getByText('Login'));
    expect(login).toHaveBeenCalledWith('a@b.co', 'secret12');
  });
});

