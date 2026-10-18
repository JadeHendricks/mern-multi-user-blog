import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import AuthContext from '../../context/authContext/AuthContext';
import Profile from './AccountProfile';
import { createQueryClient } from '../../lib/queryClient';
import { queryKeys } from '../../lib/queryKeys';
import { mockApi, asFormData } from '../../testing/mockApi';
import type { MockHandler } from '../../testing/mockApi';
import { mustQuery } from '../../testing/dom';
import { testAuth } from '../../testing/testAuth';

const ann = { _id: 'u1', name: 'Ann', avatar: 'a.png', socials: { facebook: 'https://fb.test/ann' } };
const bob = { _id: 'u2', name: 'Bob', avatar: 'b.png', socials: { facebook: 'https://fb.test/bob' } };

const annsPost = {
  _id: 'p1', title: 'Ann post', image: 'x.png', date: '2020-01-01', tag: 'general', description: 'desc',
  user: ann, likes: [], comments: [],
};

const queryClient = createQueryClient({ retry: false });
// The Link changes :id while the same Profile stays mounted, like clicking from one profile to another.
const Page = () => (
  <>
    <Link to="/profile/u2">to bob</Link>
    <Profile />
  </>
);
// `loggedIn` is the signed-in user's id. Rerendering with another id swaps the session.
const tree = (loggedIn = 'u1') => (
  <QueryClientProvider client={queryClient}>
    <AuthContext.Provider
      value={testAuth({
        loggedInUser: { _id: loggedIn, email: 'me@test.dev' },
        isUsersData: (a, b) => a === b,
        authLoading: false,
      })}
    >
      <MemoryRouter initialEntries={['/profile/u1']}>
        <Routes>
          <Route path="/profile/:id" element={<Page />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  </QueryClientProvider>
);

const baseRoutes = (): Record<string, MockHandler> => {
  // The fake server remembers the like, so the refetch after the mutation agrees with the cache.
  let liked = false;
  return {
    'GET /api/user/u1': { body: { user: ann } },
    'GET /api/user/u2': { body: { user: bob } },
    'GET /api/post/user/u1': () => ({ body: { posts: [{ ...annsPost, likes: liked ? [{ user: 'u1' }] : [] }] } }),
    'GET /api/post/user/u2': { body: { posts: [] } },
    'PUT /api/post/like/p1': () => {
      liked = true;
      return { body: { message: 'Post has been liked.', likes: [{ user: 'u1' }] } };
    },
  };
};

beforeEach(() => {
  vi.spyOn(toast, 'success').mockImplementation(() => 0);
  vi.spyOn(toast, 'error').mockImplementation(() => 0);
});
afterEach(() => {
  cleanup();
  queryClient.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('AccountProfile data', () => {
  it('shows the user from /api/user/:id and the number of posts', async () => {
    mockApi(baseRoutes());
    render(tree());
    expect(await screen.findByRole('heading', { name: 'Ann' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /All posts \(1\)/ })).toBeInTheDocument();
  });

  it('toasts the server message and keeps the empty frame when the user cannot be loaded', async () => {
    mockApi({ ...baseRoutes(), 'GET /api/user/u1': { status: 400, body: { message: 'User not found!' } } });
    render(tree());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('User not found!'));
    expect(document.querySelector('.user-header__info-name')).toBeEmptyDOMElement();
  });
});

// B23: the account settings form copied props into state once, so showing a different user kept
// the previous user's name and socials in the form (and a save would have written them back).
describe('AccountProfile account settings form', () => {
  it('shows the new user values after the user changes', async () => {
    mockApi(baseRoutes());
    const { rerender } = render(tree('u1'));
    fireEvent.click(await screen.findByRole('button', { name: 'Account settings' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Ann');
    expect(screen.getByLabelText('Facebook URL')).toHaveValue('https://fb.test/ann');
    // Bob signs in and opens his own profile; the settings tab stays selected.
    rerender(tree('u2'));
    fireEvent.click(screen.getByText('to bob'));
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('Bob'));
    expect(screen.getByLabelText('Facebook URL')).toHaveValue('https://fb.test/bob');
  });

  it('sends name and avatar as FormData without a Content-Type, then refreshes the profile and the session', async () => {
    const api = mockApi({ ...baseRoutes(), 'PUT /api/user/me': { body: { message: 'Profile updated', user: ann } }, 'GET /api/user/me': { body: { user: ann } } });
    queryClient.setQueryData(queryKeys.me, ann);
    render(tree());
    fireEvent.click(await screen.findByRole('button', { name: 'Account settings' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ann Lee' } });
    const file = new File(['x'], 'me.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Choose a new profile picture'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Account' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Profile updated'));
    const call = api.firstCallTo('PUT /api/user/me');
    expect(call.body).toBeInstanceOf(FormData);
    expect(call.headers).toBeUndefined();
    expect(asFormData(call.body).get('name')).toBe('Ann Lee');
    expect(asFormData(call.body).get('avatar')).toBeInstanceOf(File);
    // The open profile was refetched.
    await waitFor(() => expect(api.callsTo('GET /api/user/u1').length).toBeGreaterThan(1));
    expect(queryClient.getQueryState(queryKeys.me)?.isInvalidated).toBe(true);
  });

  it('sends the socials as JSON and refreshes the profile', async () => {
    const api = mockApi({ ...baseRoutes(), 'PUT /api/user/u1/socials': { body: { message: 'Socials updated', user: ann } } });
    render(tree());
    fireEvent.click(await screen.findByRole('button', { name: 'Account settings' }));
    fireEvent.change(screen.getByLabelText('Twitter URL'), { target: { name: 'twitter', value: 'https://tw.test/ann' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Socials' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Socials updated'));
    const call = api.firstCallTo('PUT /api/user/u1/socials');
    expect(call.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(call.body).toEqual({ facebook: 'https://fb.test/ann', linkedin: '', twitter: 'https://tw.test/ann' });
    await waitFor(() => expect(api.callsTo('GET /api/user/u1').length).toBeGreaterThan(1));
  });

  it('keeps the profile on screen and toasts the server message when saving fails', async () => {
    mockApi({ ...baseRoutes(), 'PUT /api/user/u1/socials': { status: 400, body: { message: 'Invalid socials' } } });
    render(tree());
    fireEvent.click(await screen.findByRole('button', { name: 'Account settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Update Socials' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Invalid socials'));
    expect(screen.getByRole('heading', { name: 'Ann' })).toBeInTheDocument();
    expect(screen.getByLabelText('Facebook URL')).toHaveValue('https://fb.test/ann');
  });
});

// B21: a like on the profile page updated PostContext but never the profile's own post list, so
// the count on the card stayed where it was.
describe('AccountProfile post cards (B21)', () => {
  it('updates the like count on an own post card', async () => {
    mockApi(baseRoutes());
    const { container } = render(tree());
    expect(await screen.findByText('0 Likes')).toBeInTheDocument();
    fireEvent.click(mustQuery(container, 'svg.card-interaction__icon:not(.card-interaction__icon--comment)'));
    expect(await screen.findByText('1 Like')).toBeInTheDocument();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Post has been liked.'));
  });

  it('updates the like count on another user\u2019s post card', async () => {
    mockApi(baseRoutes());
    // Bob looks at Ann's profile.
    const { container } = render(tree('u2'));
    expect(await screen.findByText('0 Likes')).toBeInTheDocument();
    fireEvent.click(mustQuery(container, 'svg.card-interaction__icon:not(.card-interaction__icon--comment)'));
    expect(await screen.findByText('1 Like')).toBeInTheDocument();
  });

  it('deletes an own post after confirming, and toasts the result', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const api = mockApi({ ...baseRoutes(), 'DELETE /api/post/p1': { body: { message: 'Post has been deleted.' } } });
    render(tree());
    fireEvent.click(await screen.findByRole('button', { name: 'Delete post' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Post has been deleted.'));
    expect(api.callsTo('DELETE /api/post/p1')).toHaveLength(1);
  });

  it('keeps the card and toasts the server message when the delete fails', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockApi({
      ...baseRoutes(),
      'DELETE /api/post/p1': { status: 401, body: { message: 'This post does not belong to you.' } },
    });
    render(tree());
    fireEvent.click(await screen.findByRole('button', { name: 'Delete post' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('This post does not belong to you.'));
    expect(screen.getByText('Ann post')).toBeInTheDocument();
  });
});
