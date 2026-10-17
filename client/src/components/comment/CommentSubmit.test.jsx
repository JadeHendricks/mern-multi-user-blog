import React from 'react';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import AuthContext from '../../context/authContext/AuthContext';
import PostContext from '../../context/postContext/PostContext';
import CommentSubmit from './CommentSubmit';

const renderSubmit = (isAuthenticated, createComment = vi.fn()) =>
  render(
    <AuthContext.Provider value={{ isAuthenticated }}>
      <PostContext.Provider value={{ createComment }}>
        <MemoryRouter>
          <CommentSubmit postId="p1" postUser="u1" comments={[]} />
        </MemoryRouter>
      </PostContext.Provider>
    </AuthContext.Provider>
  );

describe('CommentSubmit', () => {
  afterEach(cleanup);

  it('clears the textarea after the comment was saved', async () => {
    const createComment = vi.fn().mockResolvedValue(true);
    const { getByPlaceholderText, getByText } = renderSubmit(true, createComment);
    const box = getByPlaceholderText('Comment...');
    fireEvent.change(box, { target: { value: 'nice post' } });
    fireEvent.click(getByText('Submit comment'));
    await waitFor(() => expect(box).toHaveValue(''));
    expect(createComment).toHaveBeenCalledWith('p1', { comment: 'nice post' });
  });

  it('keeps the text when saving failed', async () => {
    const createComment = vi.fn().mockResolvedValue(false);
    const { getByPlaceholderText, getByText } = renderSubmit(true, createComment);
    const box = getByPlaceholderText('Comment...');
    fireEvent.change(box, { target: { value: 'nice post' } });
    fireEvent.click(getByText('Submit comment'));
    await waitFor(() => expect(createComment).toHaveBeenCalled());
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

