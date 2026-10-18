import { render, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import AuthContext from '../../../context/authContext/AuthContext';
import Login from './Login';
import { testAuth } from '../../../testing/testAuth';
import { expectEveryFieldLabelled } from '../../../testing/dom';

// Login has no client-side validation (the API validates), so this asserts that submit passes the
// typed values to the context's login method.
describe('Login form', () => {
  afterEach(cleanup);

  it('passes the typed email and password to login on submit', () => {
    const login = vi.fn();
    const { container, getByLabelText, getByText } = render(
      <AuthContext.Provider value={testAuth({ login, isAuthenticated: false, loggedInUser: null })}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expectEveryFieldLabelled(container);
    fireEvent.change(getByLabelText('Email address'), { target: { name: 'email', value: 'a@b.co' } });
    fireEvent.change(getByLabelText('Password'), { target: { name: 'password', value: 'secret12' } });
    fireEvent.click(getByText('Login'));
    expect(login).toHaveBeenCalledWith('a@b.co', 'secret12');
  });
});

