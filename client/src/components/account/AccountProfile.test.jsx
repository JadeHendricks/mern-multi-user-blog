import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import AuthContext from '../../context/authContext/AuthContext';
import UserContext from '../../context/userContext/UserContext';
import PostContext from '../../context/postContext/PostContext';
import Profile from './AccountProfile';
import { createQueryClient } from '../../lib/queryClient';
import { mockApi } from '../../testing/mockApi';

// B23: the account settings form copied props into state once, so showing a different user kept
// the previous user's name and socials in the form (and a save would have written them back).
const ann = { _id: 'u1', name: 'Ann', avatar: 'a.png', socials: { facebook: 'https://fb.test/ann' } };
const bob = { _id: 'u2', name: 'Bob', avatar: 'b.png', socials: { facebook: 'https://fb.test/bob' } };

const annsPost = {
  _id: 'p1', title: 'Ann post', image: 'x.png', date: '2020-01-01', tag: 'general', description: 'desc',
  user: ann, likes: [], comments: [],
};

const queryClient = createQueryClient({ retry: false });
const tree = (user, loggedIn = user) => (
  <QueryClientProvider client={queryClient}>
    <AuthContext.Provider
      value={{
        loggedInUser: { _id: loggedIn._id, email: 'me@test.dev' },
        isUsersData: (a, b) => a === b,
        authLoading: false,
      }}
    >
      <PostContext.Provider value={{ deletePost: vi.fn() }}>
        <UserContext.Provider value={{ getUser: vi.fn(), updateUser: vi.fn(), updateUserSocials: vi.fn(), user, userLoading: false }}>
          <MemoryRouter initialEntries={[`/profile/${user._id}`]}>
            <Routes>
              <Route path="/profile/:id" element={<Profile />} />
            </Routes>
          </MemoryRouter>
        </UserContext.Provider>
      </PostContext.Provider>
    </AuthContext.Provider>
  </QueryClientProvider>
);

beforeEach(() => {
  vi.spyOn(toast, 'success').mockImplementation(() => 0);
  vi.spyOn(toast, 'error').mockImplementation(() => 0);
  // The fake server remembers the like, so the refetch after the mutation agrees with the cache.
  let liked = false;
  mockApi({
    'GET /api/post/user/u1': () => ({ body: { posts: [{ ...annsPost, likes: liked ? [{ user: 'u1' }] : [] }] } }),
    'GET /api/post/user/u2': { body: { posts: [] } },
    'PUT /api/post/like/p1': () => {
      liked = true;
      return { body: { message: 'Post has been liked.', likes: [{ user: 'u1' }] } };
    },
  });
});
afterEach(() => {
  cleanup();
  queryClient.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('AccountProfile account settings form', () => {
  it('shows the new user values after the user changes', async () => {
    const { rerender } = render(tree(ann));
    fireEvent.click(screen.getByRole('button', { name: /Account settings/ }));
    expect(screen.getByLabelText('Name')).toHaveValue('Ann');
    expect(screen.getByLabelText('Facebook URL')).toHaveValue('https://fb.test/ann');
    rerender(tree(bob));
    expect(screen.getByLabelText('Name')).toHaveValue('Bob');
    expect(screen.getByLabelText('Facebook URL')).toHaveValue('https://fb.test/bob');
  });
});

// B21: a like on the profile page updated PostContext but never the profile's own post list, so
// the count on the card stayed where it was.
describe('AccountProfile post cards (B21)', () => {
  it('updates the like count on an own post card', async () => {
    const { container } = render(tree(ann));
    expect(await screen.findByText('0 Likes')).toBeInTheDocument();
    fireEvent.click(container.querySelector('svg.card__interaction-icon:not(.card__interaction-icon-comment)'));
    expect(await screen.findByText('1 Like')).toBeInTheDocument();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Post has been liked.'));
  });

  it('updates the like count on another user\u2019s post card', async () => {
    // Bob looks at Ann's profile.
    const { container } = render(tree(ann, bob));
    expect(await screen.findByText('0 Likes')).toBeInTheDocument();
    fireEvent.click(container.querySelector('svg.card__interaction-icon:not(.card__interaction-icon-comment)'));
    expect(await screen.findByText('1 Like')).toBeInTheDocument();
  });

  it('lists the user\u2019s posts from /api/post/user/:id and shows their number', async () => {
    render(tree(ann));
    expect(await screen.findByText('Ann post')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /All posts \(1\)/ })).toBeInTheDocument();
  });

  it('deletes an own post after confirming, and toasts the result', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const api = mockApi({
      'GET /api/post/user/u1': { body: { posts: [annsPost] } },
      'DELETE /api/post/p1': { body: { message: 'Post has been deleted.' } },
    });
    render(tree(ann));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete post' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Post has been deleted.'));
    expect(api.callsTo('DELETE /api/post/p1')).toHaveLength(1);
  });

  it('keeps the card and toasts the server message when the delete fails', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockApi({
      'GET /api/post/user/u1': { body: { posts: [annsPost] } },
      'DELETE /api/post/p1': { status: 401, body: { message: 'This post does not belong to you.' } },
    });
    render(tree(ann));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete post' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('This post does not belong to you.'));
    expect(screen.getByText('Ann post')).toBeInTheDocument();
  });
});