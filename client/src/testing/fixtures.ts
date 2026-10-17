import type { PostWithAuthor } from '../lib/types';

// A complete post for tests that hand posts to typed code. Pass only what the test looks at.
export const makePost = (overrides: Partial<PostWithAuthor> = {}): PostWithAuthor => ({
  _id: 'p1',
  user: null,
  image: 'default.jpg',
  title: 'Title',
  tag: 'general',
  description: 'Description',
  likes: [],
  comments: [],
  date: '2020-01-01T00:00:00.000Z',
  ...overrides,
});
