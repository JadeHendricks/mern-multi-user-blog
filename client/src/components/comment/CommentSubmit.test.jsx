import React from 'react';
import { fireEvent, waitFor, cleanup } from '@testing-library/react';
import { toast } from 'react-toastify';
import CommentSubmit from './CommentSubmit';
import { mockApi } from '../../testing/mockApi';
import { renderWithProviders } from '../../testing/renderWithProviders';

const renderSubmit = (isAuthenticated, routes = {}) => {
  const api = mockApi({
    'POST /api/post/comment/p1': { status: 201, body: { message: 'Comment has been added.', comment: [] } },
    ...routes,
  });
  const utils = renderWithProviders(<CommentSubmit postId="p1" postUser="u1" comments={[]} />, {
    auth: { isAuthenticated },
  });
  return { ...utils, api };
};

describe('CommentSubmit', () => {
  beforeEach(() => {
    vi.spyOn(toast, 'success').mockImplementation(() => 0);
    vi.spyOn(toast, 'error').mockImplementation(() => 0);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('clears the textarea after the comment was saved', async () => {
    const { getByPlaceholderText, getByText, api } = renderSubmit(true);
    const box = getByPlaceholderText('Comment...');
    fireEvent.change(box, { target: { value: 'nice post' } });
    fireEvent.click(getByText('Submit comment'));
    await waitFor(() => expect(box).toHaveValue(''));
    expect(api.callsTo('POST /api/post/comment/p1')[0].body).toEqual({ comment: 'nice post' });
    expect(toast.success).toHaveBeenCalledWith('Comment has been added.');
  });

  it('keeps the text when saving failed', async () => {
    const { getByPlaceholderText, getByText } = renderSubmit(true, {
      'POST /api/post/comment/p1': { status: 400, body: { message: 'Comment is required' } },
    });
    const box = getByPlaceholderText('Comment...');
    fireEvent.change(box, { target: { value: 'nice post' } });
    fireEvent.click(getByText('Submit comment'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Comment is required'));
    expect(box).toHaveValue('nice post');
  });

  it('hides the login link when authenticated', () => {
    const { queryByText, queryByPlaceholderText } = renderSubmit(true);
    expect(queryByText(/Log in to submit a comment/)).toBeNull();
    expect(queryByPlaceholderText('Comment...')).toBeInTheDocument();
  });

  it('shows a login link and no form when not authenticated', () => {
    const { getByText, queryByPlaceholderText } = renderSubmit(false);
    expect(getByText(/Log in to submit a comment/)).toHaveAttribute('href', '/login');
    expect(queryByPlaceholderText('Comment...')).toBeNull();
  });
});
