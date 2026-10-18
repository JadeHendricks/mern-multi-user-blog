import { cleanup, screen } from '@testing-library/react';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import { renderWithProviders } from '../../../testing/renderWithProviders';
import { expectEveryFieldLabelled } from '../../../testing/dom';

afterEach(cleanup);

describe('Register and ForgotPassword forms', () => {
  it('labels every Register field', () => {
    const { container } = renderWithProviders(<Register />, {
      auth: { register: vi.fn(), isAuthenticated: false, loggedInUser: null },
    });
    expectEveryFieldLabelled(container);
    for (const name of ['Name', 'Email address', 'Password']) {
      expect(screen.getByLabelText(name)).toBeInTheDocument();
    }
  });

  it('labels the ForgotPassword field', () => {
    const { container } = renderWithProviders(<ForgotPassword />, {
      auth: { forgotPassword: vi.fn(), isAuthenticated: false, loggedInUser: null },
    });
    expectEveryFieldLabelled(container);
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
  });
});
