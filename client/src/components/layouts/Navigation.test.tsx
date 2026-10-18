import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import AuthContext from '../../context/authContext/AuthContext';
import Navigation from './Navigation';
import { testAuth } from '../../testing/testAuth';
import type { TestAuth } from '../../testing/testAuth';

afterEach(cleanup);

const renderNav = (auth: TestAuth) =>
  render(
    <AuthContext.Provider value={testAuth(auth)}>
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    </AuthContext.Provider>
  );

const loggedIn = (logout = vi.fn()): TestAuth => ({
  isAuthenticated: true,
  loggedInUser: { _id: 'u1', name: 'Ann Lee', avatar: 'a.png' },
  logout,
});

describe('Navigation log out', () => {
  it('is a button, not a link', () => {
    renderNav(loggedIn());
    expect(screen.getByRole('button', { name: 'Log out' })).toHaveAttribute('type', 'button');
    expect(screen.queryByRole('link', { name: 'Log out' })).toBeNull();
  });

  it('calls logout once when pressed', () => {
    const logout = vi.fn();
    renderNav(loggedIn(logout));
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('can take keyboard focus', () => {
    renderNav(loggedIn());
    const button = screen.getByRole('button', { name: 'Log out' });
    button.focus();
    expect(button).toHaveFocus();
  });

  it('is not shown to a visitor', () => {
    renderNav({ isAuthenticated: false, loggedInUser: null });
    expect(screen.queryByRole('button', { name: 'Log out' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
  });
});
