import React from 'react';
import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Routes, Route } from 'react-router';
import { toast } from 'react-toastify';
import PostContext from '../../context/postContext/PostContext';
import Post from './Post';
import { mockApi } from '../../testing/mockApi';
import { renderWithProviders } from '../../testing/renderWithProviders';

const me = { _id: 'u1', name: 'Ann' };
const post = {
  _id: 'p1',
  title: 'Hello world',
  description: 'desc',
  image: 'x.png',
  user: me,
  likes: [],
  comments: [
    { _id: 'c1', userId: 'u1', name: 'Ann', avatar: 'a.png', comment: 'first', date: '2020-01-01' },
    { _id: 'c2', userId: 'u2', name: 'Bob', avatar: 'b.png', comment: 'second', date: '2020-01-02' },
  ],
};
const auth = { loggedInUser: me, isAuthenticated: true, isUsersData: (a, b) => a === b, authLoading: false };

const renderPost = (routes = {}, options = {}) => {
  const api = mockApi({ 'GET /api/post/p1': { body: { post } }, ...routes });
  const utils = renderWithProviders(
    <PostContext.Provider value={{ deletePost: vi.fn() }}>
      <Routes>
        <Route path="/users" element={<div>users page</div>} />
        <Route path="/post/:id" element={<Post />} />
      </Routes>
    </PostContext.Provider>,
    { route: '/post/p1', auth, ...options },
  );
  return { ...utils, api };
};

beforeEach(() => {
  vi.spyOn(toast, 'success').mockImplementation(() => 0);
  vi.spyOn(toast, 'error').mockImplementation(() => 0);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Post go back', () => {
  it('goes back one history entry', async () => {
    renderPost({}, { route: ['/users', '/post/p1'], index: 1 });
    fireEvent.click(await screen.findByRole('button', { name: 'Go back' }));
    expect(screen.getByText('users page')).toBeInTheDocument();
  });
});

describe('Post page data', () => {
  it('shows the post and its comments from /api/post/:id', async () => {
    renderPost();
    expect(await screen.findByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });

  it('toasts the server message and keeps the empty frame when the post cannot be loaded', async () => {
    renderPost({ 'GET /api/post/p1': { status: 404, body: { message: 'Post not found' } } });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Post not found'));
    expect(screen.queryByText('Hello world')).toBeNull();
    expect(document.querySelector('.post__banner')).not.toBeNull();
  });
});

// B21: every failed mutation used to dispatch POST_ERROR, which replaced the post (and the list)
// with empty values, so one failed request blanked the page.
describe('Post page mutations (B21)', () => {
  it('keeps the post and its comments when deleting a comment fails', async () => {
    renderPost({ 'DELETE /api/post/comment/p1/c1': { status: 500, body: { message: 'Server broke' } } });
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Comment' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Server broke'));
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });

  it('removes the comment when deleting succeeds', async () => {
    renderPost({ 'DELETE /api/post/comment/p1/c1': { body: { message: 'Comment has been deleted.' } } });
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Comment' }));
    await waitFor(() => expect(screen.queryByText('first')).toBeNull());
    expect(toast.success).toHaveBeenCalledWith('Comment has been deleted.');
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });

  it('keeps the post when adding a comment fails', async () => {
    renderPost({ 'POST /api/post/comment/p1': { status: 400, body: { message: 'Comment is required' } } });
    await screen.findByText('Hello world');
    fireEvent.change(screen.getByPlaceholderText('Comment...'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit comment' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Comment is required'));
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('first')).toBeInTheDocument();
  });

  it('adds the new comment list to the page when adding succeeds', async () => {
    const added = { _id: 'c3', userId: 'u1', name: 'Ann', avatar: 'a.png', comment: 'third', date: '2020-01-03' };
    renderPost({
      'POST /api/post/comment/p1': { status: 201, body: { message: 'Comment has been added.', comment: [...post.comments, added] } },
    });
    await screen.findByText('Hello world');
    fireEvent.change(screen.getByPlaceholderText('Comment...'), { target: { value: 'third' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit comment' }));
    expect(await screen.findByText('third')).toBeInTheDocument();
  });

  it('flips the like button at once, then rolls back and keeps the post when the like fails', async () => {
    let fail;
    renderPost({ 'PUT /api/post/like/p1': () => new Promise((resolve) => (fail = resolve)) });
    fireEvent.click(await screen.findByRole('button', { name: 'Like Post' }));
    // Optimistic: the server has not answered yet.
    expect(await screen.findByRole('button', { name: 'Unlike Post' })).toBeInTheDocument();
    fail({ status: 400, body: { message: 'Post has already been liked.' } });
    expect(await screen.findByRole('button', { name: 'Like Post' })).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Post has already been liked.');
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('never shows the loader while a like or a comment delete is running', async () => {
    renderPost({
      'PUT /api/post/like/p1': () => new Promise(() => {}),
      'DELETE /api/post/comment/p1/c1': () => new Promise(() => {}),
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Like Post' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete Comment' }));
    expect(document.querySelector('.loader-container')).toBeNull();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});
