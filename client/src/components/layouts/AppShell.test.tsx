import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import AuthContext from '../../context/authContext/AuthContext';
import AppShell from './AppShell';

afterEach(cleanup);

const renderAt = path =>
  render(
    <AuthContext.Provider value={{ isAuthenticated: false, loggedInUser: null }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<div>home page</div>} />
            <Route path="*" element={null} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('AppShell', () => {
  it('renders the page inside main', () => {
    const { container } = renderAt('/');
    expect(container.querySelector('main.main')).toHaveTextContent('home page');
  });

  it('keeps the shell with an empty main for an unknown url', () => {
    const { container } = renderAt('/does-not-exist');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(container.querySelector('main.main')).toBeEmptyDOMElement();
  });
});
