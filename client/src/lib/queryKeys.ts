// One place for every query key, so a mutation can invalidate exactly what it changed.
// Keys nest (['posts', 'list', params]), so invalidating `posts.all` hits every post query.

/** @typedef {Record<string, unknown>} ListParams */

export const queryKeys = {
  me: ['me'],
  /** @param {string} token */
  activation: (token) => ['activation', token],
  posts: {
    all: ['posts'],
    lists: () => ['posts', 'list'],
    /** @param {ListParams} [params] */
    list: (params = {}) => ['posts', 'list', params],
    /** @param {string} id */
    detail: (id) => ['posts', 'detail', id],
  },
  users: {
    all: ['users'],
    lists: () => ['users', 'list'],
    /** @param {ListParams} [params] */
    list: (params = {}) => ['users', 'list', params],
    /** @param {string} id */
    detail: (id) => ['users', 'detail', id],
    // Every user's post list (prefix), and one user's post list.
    postsAll: () => ['users', 'posts'],
    /** @param {string} id */
    posts: (id) => ['users', 'posts', id],
  },
};
