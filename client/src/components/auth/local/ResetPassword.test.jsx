import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import AuthContext from '../../../context/authContext/AuthContext';
import ResetPassword from './ResetPassword';

afterEach(cleanup);

describe('ResetPassword', () => {
  it('submits the token from the url on the first submit and follows a changed token', () => {
    const resetPassword = vi.fn();
    const tree = token => (
      <React.StrictMode>
        <AuthContext.Provider value={{ resetPassword }}>
          <ResetPassword match={{ params: { token } }} />
        </AuthContext.Provider>
      </React.StrictMode>
    );
    const { rerender } = render(tree('tok-1'));
    fireEvent.change(screen.getByLabelText('New Password'), { target: { name: 'newPassword', value: 'secret12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    expect(resetPassword).toHaveBeenLastCalledWith('secret12', 'tok-1');

    rerender(tree('tok-2'));
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    expect(resetPassword).toHaveBeenLastCalledWith('secret12', 'tok-2');
  });
});
