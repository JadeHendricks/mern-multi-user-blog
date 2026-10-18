import type { ListParams } from './types';

// One place for every query key, so a mutation can invalidate exactly what it changed.
// Keys nest (['posts', 'list', params]), so invalidating `posts.all` hits every post query.

export const queryKeys = {
  me: ['me'] as const,
  activation: (token: string) => ['activation', token] as const,
  posts: {
    all: ['posts'] as const,
    lists: () => ['posts', 'list'] as const,
    list: (params: ListParams = {}) => ['posts', 'list', params] as const,
    detail: (id: string) => ['posts', 'detail', id] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => ['users', 'list'] as const,
    list: (params: ListParams = {}) => ['users', 'list', params] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
    // Every user's post list (prefix), and one user's post list.
    postsAll: () => ['users', 'posts'] as const,
    posts: (id: string) => ['users', 'posts', id] as const,
  },
};
