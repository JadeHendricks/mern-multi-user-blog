import { queryKeys } from './queryKeys';

describe('queryKeys', () => {
  it('nests list and detail keys under the family key, so invalidating the family hits them', () => {
    expect(queryKeys.posts.list({ limit: 12 }).slice(0, 1)).toEqual(queryKeys.posts.all);
    expect(queryKeys.posts.detail('p1').slice(0, 1)).toEqual(queryKeys.posts.all);
    expect(queryKeys.users.list().slice(0, 1)).toEqual(queryKeys.users.all);
    expect(queryKeys.users.detail('u1').slice(0, 1)).toEqual(queryKeys.users.all);
  });

  it('keeps one stable key per input', () => {
    expect(queryKeys.posts.list()).toEqual(['posts', 'list', {}]);
    expect(queryKeys.posts.detail('p1')).toEqual(['posts', 'detail', 'p1']);
    expect(queryKeys.users.posts('u1')).toEqual(['users', 'posts', 'u1']);
    expect(queryKeys.me).toEqual(['me']);
  });

  it('keeps the user detail key apart from the user post list', () => {
    expect(queryKeys.users.posts('u1').slice(0, 2)).not.toEqual(queryKeys.users.detail('u1').slice(0, 2));
    expect(queryKeys.users.posts('u1').slice(0, 2)).toEqual(queryKeys.users.postsAll());
  });
});
