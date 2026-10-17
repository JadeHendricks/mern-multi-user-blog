import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import AuthContext from '../../context/authContext/AuthContext';
import PostContext from '../../context/postContext/PostContext';
import Post from './Post';

afterEach(cleanup);

describe('Post go back', () => {
  it('goes back one history entry', () => {
    const post = { _id: 'p1', title: 'Hello', user: { _id: 'u1', name: 'Ann' }, likes: [], comments: [] };
    render(
      <AuthContext.Provider value={{ loggedInUser: null, isUsersData: () => false, authLoading: false }}>
        <PostContext.Provider
          value={{ getPost: vi.fn(), post, postLoading: false, postIsLiked: () => false, likePost: vi.fn(), unLikePost: vi.fn(), deletePost: vi.fn() }}
        >
          <MemoryRouter initialEntries={['/users', '/post/p1']} initialIndex={1}>
            <Routes>
              <Route path="/users" element={<div>users page</div>} />
              <Route path="/post/:id" element={<Post />} />
            </Routes>
          </MemoryRouter>
        </PostContext.Provider>
      </AuthContext.Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByText('users page')).toBeInTheDocument();
  });
});
