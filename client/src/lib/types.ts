import type { LikeDto, PostAuthorDto, PostDto, PostListResponse, UserListResponse } from '@mern-blog/shared';

// Client-only view types on top of the shared DTOs.

export type ListParams = Record<string, unknown>;

/**
 * A like as it can sit in the cache. The server's likes always have an `_id`, but the optimistic
 * like added by useToggleLike only knows the user until the answer arrives.
 */
export type CachedLike = Pick<LikeDto, 'user'> & { _id?: LikeDto['_id'] };

/**
 * `PostDto.user` is a bare id on the create and edit answers. The list and detail endpoints always
 * populate the author (server/src/modules/posts/controller.ts), and null means the author account is gone.
 * Those are the only answers that reach the pages, so they see this narrower type.
 */
export type PostWithAuthor = Omit<PostDto, 'user' | 'likes'> & {
  user: PostAuthorDto | null;
  likes: CachedLike[];
};

export type PostListPayload = Omit<PostListResponse, 'posts'> & { posts: PostWithAuthor[] };
export interface PostDetailPayload {
  post: PostWithAuthor;
}
export type UserListPayload = UserListResponse;
