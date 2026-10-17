import React from 'react';
import { screen, waitFor, cleanup } from '@testing-library/react';
import { toast } from 'react-toastify';
import AllUsers from './AllUsers';
import { mockApi } from '../../testing/mockApi';
import { renderWithProviders } from '../../testing/renderWithProviders';

const user = (n) => ({ _id: `u${n}`, name: `User ${n}`, avatar: 'a.png', createdAt: '2020-01-01T00:00:00.000Z', socials: {} });

beforeEach(() => {
  vi.spyOn(toast, 'error').mockImplementation(() => 0);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('AllUsers', () => {
  it('lists the users from /api/user', async () => {
    mockApi({ 'GET /api/user': { body: { users: [user(1), user(2)] } } });
    renderWithProviders(<AllUsers />, { auth: {} });
    await screen.findAllByRole('link', { name: 'User 1' });
    expect(screen.getAllByRole('link', { name: 'User 2' }).length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.card-user')).toHaveLength(2);
  });

  it('shows the empty state and a toast when the list cannot be loaded', async () => {
    mockApi({ 'GET /api/user': { status: 500, body: { message: 'Server broke' } } });
    renderWithProviders(<AllUsers />, { auth: {} });
    expect(await screen.findByText('No Content Found...')).toBeInTheDocument();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Server broke'));
  });
});
