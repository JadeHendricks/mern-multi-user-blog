import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthContext from '../../context/authContext/AuthContext';
import PostContext from '../../context/postContext/PostContext';
import PostCard from './PostCard';

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

const renderCard = liked => {
  const post_ctx = {
    likePost: vi.fn(),
    unLikePost: vi.fn(),
    postIsLiked: () => liked,
    descriptionTrimmer: text => text,
  };
  const utils = render(
    <AuthContext.Provider value={{ loggedInUser: { _id: 'u2' } }}>
      <PostContext.Provider value={post_ctx}>
        <MemoryRouter>
          <PostCard post={post} />
        </MemoryRouter>
      </PostContext.Provider>
    </AuthContext.Provider>
  );
  // The heart is the interaction icon that is not the comment icon.
  const heart = utils.container.querySelector('svg.card__interaction-icon:not(.card__interaction-icon-comment)');
  return { ...utils, heart, post_ctx };
};

describe('PostCard like toggle', () => {
  afterEach(cleanup);

  it('likes the post when it is not liked yet', () => {
    const { heart, post_ctx } = renderCard(false);
    fireEvent.click(heart);
    expect(post_ctx.likePost).toHaveBeenCalledWith('p1');
    expect(post_ctx.unLikePost).not.toHaveBeenCalled();
  });

  it('unlikes the post when it is already liked', () => {
    const { heart, post_ctx } = renderCard(true);
    fireEvent.click(heart);
    expect(post_ctx.unLikePost).toHaveBeenCalledWith('p1');
    expect(post_ctx.likePost).not.toHaveBeenCalled();
  });
});
