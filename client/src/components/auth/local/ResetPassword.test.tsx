import { StrictMode } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import AuthContext from '../../../context/authContext/AuthContext';
import ResetPassword from './ResetPassword';
import { testAuth } from '../../../testing/testAuth';

afterEach(cleanup);

describe('ResetPassword', () => {
  it('submits the token from the url, also under StrictMode double effects', () => {
    const resetPassword = vi.fn();
    render(
      <StrictMode>
        <AuthContext.Provider value={testAuth({ resetPassword })}>
          <MemoryRouter initialEntries={['/auth/password/reset/tok-1']}>
            <Routes>
              <Route path="/auth/password/reset/:token" element={<ResetPassword />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </StrictMode>
    );
    fireEvent.change(screen.getByLabelText('New Password'), { target: { name: 'newPassword', value: 'secret12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    expect(resetPassword).toHaveBeenCalledTimes(1);
    expect(resetPassword).toHaveBeenLastCalledWith('secret12', 'tok-1');
  });
});
