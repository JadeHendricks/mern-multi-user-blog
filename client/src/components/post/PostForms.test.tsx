import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Routes, Route, Link } from 'react-router';
import { toast } from 'react-toastify';
import CreatePost from './CreatePost';
import EditPost from './EditPost';
import { queryKeys } from '../../lib/queryKeys';
import { mockApi, asFormData } from '../../testing/mockApi';
import type { MockHandler } from '../../testing/mockApi';
import type { TestAuth } from '../../testing/testAuth';
import { renderWithProviders } from '../../testing/renderWithProviders';

const auth: TestAuth = { loggedInUser: { _id: 'u1' }, isAuthenticated: true, authLoading: false };
const saved = { _id: 'p1', title: 'Saved title', tag: 'travel', description: 'Saved body', image: 'saved.png' };
const fields = (body: unknown) => Object.fromEntries(asFormData(body).entries());

beforeEach(() => {
  vi.spyOn(toast, 'success').mockImplementation(() => 0);
  vi.spyOn(toast, 'error').mockImplementation(() => 0);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const renderCreate = (routes: Record<string, MockHandler> = {}) => {
  const api = mockApi({
    'POST /api/post': { status: 201, body: { message: 'Post "T", has been created', post: { _id: 'new1' } } },
    'GET /api/post/new1': { body: { post: { ...saved, _id: 'new1', title: 'Created' } } },
    ...routes,
  });
  const utils = renderWithProviders(
    <Routes>
      <Route path="/create-post" element={<CreatePost />} />
      <Route path="/post/:id" element={<div>post page</div>} />
    </Routes>,
    { route: '/create-post', auth },
  );
  return { ...utils, api };
};

const fillCreate = (image?: File) => {
  fireEvent.change(screen.getByLabelText('Post Title'), { target: { name: 'title', value: 'T' } });
  fireEvent.click(screen.getByLabelText('travel'));
  fireEvent.change(screen.getByLabelText('Post Body'), { target: { name: 'description', value: 'Body' } });
  if (image) fireEvent.change(screen.getByLabelText('Choose a blog post image'), { target: { files: [image] } });
  fireEvent.click(screen.getByRole('button', { name: 'Create Post' }));
};

describe('CreatePost', () => {
  it('sends the fields as FormData without a Content-Type, then opens the new post', async () => {
    const { api, queryClient } = renderCreate();
    queryClient.setQueryData(queryKeys.posts.list(), { posts: [] });
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    fillCreate(file);
    expect(await screen.findByText('post page')).toBeInTheDocument();
    const call = api.firstCallTo('POST /api/post');
    expect(call.body).toBeInstanceOf(FormData);
    expect(call.headers).toBeUndefined();
    expect(fields(call.body)).toMatchObject({ title: 'T', tag: 'travel', description: 'Body' });
    expect(fields(call.body).image).toBeInstanceOf(File);
    expect(toast.success).toHaveBeenCalledWith('Post "T", has been created');
    expect(queryClient.getQueryState(queryKeys.posts.list())?.isInvalidated).toBe(true);
  });

  it('leaves the image field out when no photo was picked', async () => {
    const { api } = renderCreate();
    fillCreate();
    await screen.findByText('post page');
    expect(fields(api.firstCallTo('POST /api/post').body)).not.toHaveProperty('image');
  });

  it('stays on the form with the typed text and toasts the server message when it fails', async () => {
    renderCreate({ 'POST /api/post': { status: 400, body: { message: 'A post must have a title' } } });
    fillCreate();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('A post must have a title'));
    expect(screen.queryByText('post page')).toBeNull();
    expect(screen.getByLabelText('Post Title')).toHaveValue('T');
  });
});

const renderEdit = (routes: Record<string, MockHandler> = {}, route = '/edit-post/p1') => {
  const api = mockApi({
    'GET /api/post/p1': { body: { post: saved } },
    'GET /api/post/p2': { body: { post: { ...saved, _id: 'p2', title: 'Other title', description: 'Other body', tag: 'funny' } } },
    'PUT /api/post/p1': { body: { message: 'Post has been updated', post: saved } },
    ...routes,
  });
  const utils = renderWithProviders(
    <Routes>
      <Route path="/edit-post/:id" element={<EditPost />} />
      <Route path="/post/:id" element={<div>post page</div>} />
    </Routes>,
    { route, auth },
  );
  return { ...utils, api };
};

describe('EditPost', () => {
  it('fills the form from the saved post', async () => {
    renderEdit();
    await waitFor(() => expect(screen.getByLabelText('Post Title')).toHaveValue('Saved title'));
    expect(screen.getByLabelText('Post Body')).toHaveValue('Saved body');
    expect(screen.getByLabelText('travel')).toBeChecked();
  });

  it('shows the other post when the id changes, without keeping the previous values', async () => {
    mockApi({
      'GET /api/post/p1': { body: { post: saved } },
      'GET /api/post/p2': { body: { post: { ...saved, _id: 'p2', title: 'Other title', description: 'Other body', tag: 'funny' } } },
    });
    // The Link keeps the same EditPost mounted while only :id changes.
    renderWithProviders(
      <Routes>
        <Route
          path="/edit-post/:id"
          element={
            <>
              <Link to="/edit-post/p2">other post</Link>
              <EditPost />
            </>
          }
        />
      </Routes>,
      { route: '/edit-post/p1', auth },
    );
    await waitFor(() => expect(screen.getByLabelText('Post Title')).toHaveValue('Saved title'));
    fireEvent.change(screen.getByLabelText('Post Title'), { target: { name: 'title', value: 'typed over' } });
    fireEvent.click(screen.getByText('other post'));
    await waitFor(() => expect(screen.getByLabelText('Post Title')).toHaveValue('Other title'));
    expect(screen.getByLabelText('Post Body')).toHaveValue('Other body');
    expect(screen.getByLabelText('funny')).toBeChecked();
  });
  it('sends the edit as FormData (with the id, no Content-Type), then opens the post', async () => {
    const { api } = renderEdit();
    await waitFor(() => expect(screen.getByLabelText('Post Title')).toHaveValue('Saved title'));
    fireEvent.change(screen.getByLabelText('Post Title'), { target: { name: 'title', value: 'New title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Post' }));
    expect(await screen.findByText('post page')).toBeInTheDocument();
    const call = api.firstCallTo('PUT /api/post/p1');
    expect(call.body).toBeInstanceOf(FormData);
    expect(call.headers).toBeUndefined();
    expect(fields(call.body)).toEqual({ id: 'p1', title: 'New title', tag: 'travel', description: 'Saved body' });
    expect(toast.success).toHaveBeenCalledWith('Post has been updated');
    // The open post was refetched before the page opened, so it shows the saved text.
    expect(api.callsTo('GET /api/post/p1')).toHaveLength(2);
  });

  it('toasts the server message and stays on the form when saving fails', async () => {
    renderEdit({ 'PUT /api/post/p1': { status: 403, body: { message: 'This post does not belong to you.' } } });
    await waitFor(() => expect(screen.getByLabelText('Post Title')).toHaveValue('Saved title'));
    fireEvent.click(screen.getByRole('button', { name: 'Update Post' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('This post does not belong to you.'));
    expect(screen.queryByText('post page')).toBeNull();
    expect(screen.getByLabelText('Post Title')).toHaveValue('Saved title');
  });

  it('toasts when the post to edit cannot be loaded', async () => {
    renderEdit({ 'GET /api/post/p1': { status: 404, body: { message: 'Post not found' } } });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Post not found'));
    expect(screen.getByLabelText('Post Title')).toHaveValue('');
  });
});
