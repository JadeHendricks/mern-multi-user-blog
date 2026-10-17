import React from 'react';
import { fireEvent, waitFor, cleanup } from '@testing-library/react';
import { toast } from 'react-toastify';
import PostCard from './PostCard';
import { mockApi } from '../../testing/mockApi';
import { renderWithProviders } from '../../testing/renderWithProviders';

const post = {
  _id: 'p1',
  title: 'Hello',
  image: 'a.png',
  date: '2020-01-01',
  tag: 'travel',
  description: 'desc',
  user: { _id: 'u1', name: 'Ann', avatar: 'x.png' },
  likes: [],
  comments: [],
};

const renderCard = (likes, routes = {}) => {
  const api = mockApi({
    'PUT /api/post/like/p1': { body: { message: 'Post has been liked.', likes: [{ user: 'u2' }] } },
    'PUT /api/post/unlike/p1': { body: { message: 'Post has been disliked.', likes: [] } },
    ...routes,
  });
  const utils = renderWithProviders(<PostCard post={{ ...post, likes }} />, {
    auth: { loggedInUser: { _id: 'u2' } },
  });
  // The heart is the interaction icon that is not the comment icon.
  const heart = utils.container.querySelector('svg.card__interaction-icon:not(.card__interaction-icon-comment)');
  return { ...utils, heart, api };
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

  it('ignores more clicks while the request is still running', async () => {
    let release;
    const { heart, api } = renderCard([], {
      'PUT /api/post/like/p1': () => new Promise((resolve) => (release = resolve)),
    });
    fireEvent.click(heart);
    fireEvent.click(heart);
    fireEvent.click(heart);
    await waitFor(() => expect(api.callsTo('PUT /api/post/like/p1')).toHaveLength(1));
    release({ body: { message: 'Post has been liked.', likes: [{ user: 'u2' }] } });
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
  });
});
