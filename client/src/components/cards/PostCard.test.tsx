import { fireEvent, screen, waitFor, cleanup } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import PostCard from './PostCard';
import { mockApi } from '../../testing/mockApi';
import type { MockHandler, MockReply } from '../../testing/mockApi';
import { makePost } from '../../testing/fixtures';
import type { PostWithAuthor } from '../../lib/types';
import { renderWithProviders } from '../../testing/renderWithProviders';
import { createQueryClient } from '../../lib/queryClient';
import { queryKeys } from '../../lib/queryKeys';

const post = makePost({
  _id: 'p1',
  title: 'Hello',
  image: 'a.png',
  date: '2020-01-01',
  tag: 'travel',
  description: 'desc',
  user: { _id: 'u1', name: 'Ann', avatar: 'x.png' },
  likes: [],
  comments: [],
});

const renderCard = (likes: PostWithAuthor['likes'], routes: Record<string, MockHandler> = {}) => {
  const api = mockApi({
    'PUT /api/post/like/p1': { body: { message: 'Post has been liked.', likes: [{ user: 'u2' }] } },
    'PUT /api/post/unlike/p1': { body: { message: 'Post has been disliked.', likes: [] } },
    ...routes,
  });
  const utils = renderWithProviders(<PostCard post={{ ...post, likes }} />, {
    auth: { loggedInUser: { _id: 'u2' } },
  });
  const heart = utils.getByRole('button', { name: 'Like Hello' });
  return { ...utils, heart, api };
};

// A card fed from the query cache, like the real feed: the optimistic patch reaches its props.
const CachedCard = () => {
  const { data } = useQuery({
    queryKey: queryKeys.posts.detail('p1'),
    queryFn: () => Promise.resolve({ post }),
    select: (payload) => payload.post,
    staleTime: Infinity,
  });
  return data ? <PostCard post={data} /> : null;
};

describe('PostCard like toggle', () => {
  beforeEach(() => {
    vi.spyOn(toast, 'success').mockImplementation(() => 0);
    vi.spyOn(toast, 'error').mockImplementation(() => 0);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('likes the post when it is not liked yet', async () => {
    const { heart, api } = renderCard([]);
    fireEvent.click(heart);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Post has been liked.'));
    expect(api.callsTo('PUT /api/post/like/p1')).toHaveLength(1);
    expect(api.callsTo('PUT /api/post/unlike/p1')).toHaveLength(0);
  });

  it('unlikes the post when it is already liked', async () => {
    const { heart, api } = renderCard([{ user: 'u2' }]);
    fireEvent.click(heart);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Post has been disliked.'));
    expect(api.callsTo('PUT /api/post/unlike/p1')).toHaveLength(1);
    expect(api.callsTo('PUT /api/post/like/p1')).toHaveLength(0);
  });

  it('shows the server message when liking fails', async () => {
    const { heart } = renderCard([], {
      'PUT /api/post/like/p1': { status: 401, body: { message: 'You are not logged in! Please log in to get access.' } },
    });
    fireEvent.click(heart);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('You are not logged in! Please log in to get access.'));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('describes the post image with the post title and leaves the author avatar decorative', () => {
    const { container } = renderCard([]);
    // The post image is a meaningful image named after the post, not after its author.
    expect(screen.getByRole('img', { name: 'Hello' })).toHaveClass('card__image');
    // The author name sits right beside the avatar, so the avatar adds nothing for a screen reader.
    expect(container.querySelector('img.card__avatar')).toHaveAttribute('alt', '');
    expect(screen.queryByRole('img', { name: 'Ann' })).toBeNull();
  });

  it('exposes the heart as a focusable toggle button', () => {
    const { heart } = renderCard([]);
    expect(heart).toHaveAttribute('type', 'button');
    expect(heart).toHaveAttribute('aria-pressed', 'false');
    heart.focus();
    expect(heart).toHaveFocus();
  });

  it('starts pressed when the signed-in user already likes the post', () => {
    const { heart } = renderCard([{ user: 'u2' }]);
    expect(heart).toHaveAttribute('aria-pressed', 'true');
  });

  it('flips aria-pressed right after the click, before the server answers', async () => {
    const gate = Promise.withResolvers<MockReply>();
    mockApi({
      'PUT /api/post/like/p1': () => gate.promise,
      'PUT /api/post/unlike/p1': () => gate.promise,
    });
    const queryClient = createQueryClient({ retry: false });
    queryClient.setQueryData(queryKeys.posts.detail('p1'), { post: { ...post, likes: [] } });
    renderWithProviders(<CachedCard />, { auth: { loggedInUser: { _id: 'u2' } }, queryClient });
    const heart = await screen.findByRole('button', { name: 'Like Hello' });
    expect(heart).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(heart);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Like Hello' })).toHaveAttribute('aria-pressed', 'true'));

    // A failed answer puts the old state back.
    gate.resolve({ status: 500, body: { message: 'Server broke' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Like Hello' })).toHaveAttribute('aria-pressed', 'false'));
  });

  it('ignores more clicks while the request is still running', async () => {
    const gate = Promise.withResolvers<MockReply>();
    const { heart, api } = renderCard([], {
      'PUT /api/post/like/p1': () => gate.promise,
    });
    fireEvent.click(heart);
    fireEvent.click(heart);
    fireEvent.click(heart);
    await waitFor(() => expect(api.callsTo('PUT /api/post/like/p1')).toHaveLength(1));
    gate.resolve({ body: { message: 'Post has been liked.', likes: [{ user: 'u2' }] } });
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
  });
});
