import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { toast } from 'react-toastify';
import AllUsers from './AllUsers';
import { mockApi } from '../../testing/mockApi';
import { renderWithProviders } from '../../testing/renderWithProviders';

const user = (n: number) => ({ _id: `u${n}`, name: `User ${n}`, avatar: 'a.png', createdAt: '2020-01-01T00:00:00.000Z', socials: {} });

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
    mockApi({ 'GET /api/user?limit=12': { body: { users: [user(1), user(2)], nextCursor: null } } });
    renderWithProviders(<AllUsers />, { auth: {} });
    await screen.findAllByRole('link', { name: 'User 1' });
    expect(screen.getAllByRole('link', { name: 'User 2' }).length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.card-user')).toHaveLength(2);
  });

  it('shows the empty state and a toast when the list cannot be loaded', async () => {
    mockApi({ 'GET /api/user?limit=12': { status: 500, body: { message: 'Server broke' } } });
    renderWithProviders(<AllUsers />, { auth: {} });
    expect(await screen.findByText('No Content Found...')).toBeInTheDocument();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Server broke'));
  });
});

describe('AllUsers load more', () => {
  const loadMore = () => screen.queryByRole('button', { name: 'Load more' });

  it('shows Load more only while there is a next page, appends it and hides at the end', async () => {
    mockApi({
      'GET /api/user?limit=12': { body: { users: [user(1), user(2)], nextCursor: 'c1' } },
      'GET /api/user?limit=12&cursor=c1': { body: { users: [user(3)], nextCursor: null } },
    });
    renderWithProviders(<AllUsers />, { auth: {} });
    await screen.findAllByRole('link', { name: 'User 1' });
    expect(loadMore()).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    await screen.findAllByRole('link', { name: 'User 3' });
    expect(document.querySelectorAll('.card-user')).toHaveLength(3);
    expect(loadMore()).not.toBeInTheDocument();
  });

  it('hides Load more when nextCursor is null', async () => {
    mockApi({ 'GET /api/user?limit=12': { body: { users: [user(1)], nextCursor: null } } });
    renderWithProviders(<AllUsers />, { auth: {} });
    await screen.findAllByRole('link', { name: 'User 1' });
    expect(loadMore()).not.toBeInTheDocument();
  });
});
