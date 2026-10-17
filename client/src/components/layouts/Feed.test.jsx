import React from 'react';
import { screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { toast } from 'react-toastify';
import Base from './Base';
import MostPopularPosts from './MostPopularPosts';
import { uploadUrl } from '../../utils/imageUrl';
import { queryKeys } from '../../lib/queryKeys';
import { mockApi } from '../../testing/mockApi';
import { renderWithProviders } from '../../testing/renderWithProviders';

// PostCard calls uploadUrl on every render, with its own image name, so counting calls per name
// counts renders per card.
vi.mock('../../utils/imageUrl', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, uploadUrl: vi.fn(actual.uploadUrl) };
});

const makePost = (n, likes = 0) => ({
  _id: `p${n}`,
  title: `Post ${n}`,
  image: `img-${n}.png`,
  date: '2020-01-01',
  tag: 'general',
  description: `description ${n}`,
  user: { _id: 'u9', name: 'Writer', avatar: 'w.png' },
  likes: Array.from({ length: likes }, (_, i) => ({ user: `liker${i}` })),
  comments: [],
});
const auth = { loggedInUser: { _id: 'me' }, isAuthenticated: true, isUsersData: (a, b) => a === b };
const cardOf = (title) => screen.getByRole('link', { name: title }).closest('.card');
const rendersOf = (image) => uploadUrl.mock.calls.filter(([kind, name]) => kind === 'posts' && name === image).length;

beforeEach(() => {
  vi.spyOn(toast, 'success').mockImplementation(() => 0);
  vi.spyOn(toast, 'error').mockImplementation(() => 0);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  uploadUrl.mockClear();
});

describe('home feed', () => {
  it('lists the posts from /api/post', async () => {
    mockApi({ 'GET /api/post': { body: { posts: [makePost(1), makePost(2)] } } });
    renderWithProviders(<Base />, { auth });
    expect(await screen.findByRole('link', { name: 'Post 1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Post 2' })).toBeInTheDocument();
  });

  it('shows the empty state and a toast when the list cannot be loaded', async () => {
    mockApi({ 'GET /api/post': { status: 500, body: { message: 'Server broke' } } });
    renderWithProviders(<Base />, { auth });
    expect(await screen.findByText('No Content Found...')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Server broke');
  });

  it('likes one card: only that card changes and the others do not render again', async () => {
    // The fake server remembers the like, so the refetch after the mutation agrees with the cache.
    let liked = false;
    mockApi({
      'GET /api/post': () => ({ body: { posts: [makePost(1), { ...makePost(2), likes: liked ? [{ user: 'me' }] : [] }, makePost(3)] } }),
      'PUT /api/post/like/p2': () => {
        liked = true;
        return { body: { message: 'Post has been liked.', likes: [{ user: 'liker0' }] } };
      },
    });
    const { container } = renderWithProviders(<Base />, { auth });
    await screen.findByRole('link', { name: 'Post 2' });
    const before = { 1: rendersOf('img-1.png'), 2: rendersOf('img-2.png'), 3: rendersOf('img-3.png') };

    fireEvent.click(cardOf('Post 2').querySelector('svg.card__interaction-icon:not(.card__interaction-icon-comment)'));
    await waitFor(() => expect(within(cardOf('Post 2')).getByText('1 Like')).toBeInTheDocument());
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Post has been liked.'));

    expect(within(cardOf('Post 1')).getByText('0 Likes')).toBeInTheDocument();
    expect(within(cardOf('Post 3')).getByText('0 Likes')).toBeInTheDocument();
    expect(rendersOf('img-1.png')).toBe(before[1]);
    expect(rendersOf('img-3.png')).toBe(before[3]);
    expect(rendersOf('img-2.png')).toBeGreaterThan(before[2]);
    // The filled heart is the liked one.
    const filled = [...container.querySelectorAll('use')].filter((use) => use.getAttribute('xlink:href')?.endsWith('#icon-heart'));
    expect(filled).toHaveLength(1);
  });

  it('puts a failed like back and keeps every card', async () => {
    mockApi({
      'GET /api/post': { body: { posts: [makePost(1), makePost(2)] } },
      'PUT /api/post/like/p1': { status: 500, body: { message: 'Server broke' } },
    });
    renderWithProviders(<Base />, { auth });
    await screen.findByRole('link', { name: 'Post 1' });
    fireEvent.click(cardOf('Post 1').querySelector('svg.card__interaction-icon:not(.card__interaction-icon-comment)'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Server broke'));
    await waitFor(() => expect(within(cardOf('Post 1')).getByText('0 Likes')).toBeInTheDocument());
    expect(cardOf('Post 2')).toBeInTheDocument();
  });
});

describe('most popular posts', () => {
  it('shows the six most liked posts, most liked first, without reordering the shared feed cache', async () => {
    const posts = [makePost(1, 1), makePost(2, 5), makePost(3, 3), makePost(4, 0), makePost(5, 4), makePost(6, 2), makePost(7, 6)];
    mockApi({ 'GET /api/post': { body: { posts } } });
    const { queryClient } = renderWithProviders(<MostPopularPosts />, { auth });
    await screen.findByRole('link', { name: 'Post 2' });
    const titles = [...document.querySelectorAll('.card__title')].map((el) => el.textContent);
    expect(titles).toEqual(['Post 7', 'Post 2', 'Post 5', 'Post 3', 'Post 6', 'Post 1']);
    expect(queryClient.getQueryData(queryKeys.posts.list()).posts.map((p) => p._id)).toEqual(
      posts.map((p) => p._id),
    );
  });
});
