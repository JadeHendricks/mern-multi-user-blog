import { z } from 'zod';

// Response bodies as they appear on the wire (JSON). Each type is inferred from its schema, so there
// is exactly one definition. Dates are ISO strings here; the server's store views keep Date objects
// and derive from these types (see server/src/store/types.ts).
//
// Schemas are not strict on purpose: the Mongo adapter may add bookkeeping keys such as `__v`.
// The exact key sets are pinned by server/test/api/contracts.test.ts and shared/test/dto.test.ts.

/** 24-character lowercase hex id, the same on every storage adapter. */
export const idSchema = z.string().regex(/^[0-9a-f]{24}$/);
const isoDate = z.iso.datetime();

/** Only keys that have been set are present. A cleared link is kept as ''. */
export const socialsSchema = z.object({
  facebook: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
});
export type SocialsDto = z.infer<typeof socialsSchema>;

/** What anybody may see of an active user. */
export const publicUserSchema = z.object({
  _id: idSchema,
  name: z.string(),
  avatar: z.string(),
  socials: socialsSchema.optional(),
  createdAt: isoDate,
});
export type PublicUserDto = z.infer<typeof publicUserSchema>;

/** What a user sees of their own account. */
export const ownUserSchema = z.object({
  _id: idSchema,
  name: z.string(),
  email: z.string(),
  avatar: z.string(),
  socials: socialsSchema.optional(),
  role: z.enum(['user', 'admin']),
  status: z.enum(['pending', 'active']),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type OwnUserDto = z.infer<typeof ownUserSchema>;

export const likeSchema = z.object({ _id: idSchema, user: idSchema });
export type LikeDto = z.infer<typeof likeSchema>;

export const commentSchema = z.object({
  _id: idSchema,
  comment: z.string(),
  date: isoDate,
  userId: idSchema,
  /** Current name of the author ("Deleted user" when the account is gone). */
  name: z.string(),
  /** Current avatar of the author ("default.jpg" when the account is gone). */
  avatar: z.string(),
});
export type CommentDto = z.infer<typeof commentSchema>;

export const postAuthorSchema = z.object({
  _id: idSchema,
  name: z.string(),
  avatar: z.string(),
  /** Only on the post detail endpoint, and only when the author has set one. */
  socials: socialsSchema.optional(),
});
export type PostAuthorDto = z.infer<typeof postAuthorSchema>;

export const postSchema = z.object({
  _id: idSchema,
  /** An id from create and edit, the populated author from detail and lists, null once the author is gone. */
  user: z.union([idSchema, postAuthorSchema, z.null()]),
  image: z.string(),
  title: z.string(),
  tag: z.string(),
  description: z.string(),
  /** Newest first. */
  likes: z.array(likeSchema),
  /** Newest first. */
  comments: z.array(commentSchema),
  date: isoDate,
});
export type PostDto = z.infer<typeof postSchema>;

// Envelopes
export const messageResponseSchema = z.object({ message: z.string() });
export type MessageResponse = z.infer<typeof messageResponseSchema>;
/** Every error answer: { message } and nothing else. */
export const errorBodySchema = messageResponseSchema;
export type ErrorBody = MessageResponse;

export const activationPreviewResponseSchema = z.object({ name: z.string() });
export type ActivationPreviewResponse = z.infer<typeof activationPreviewResponseSchema>;

export const loginResponseSchema = z.object({ user: ownUserSchema });
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const meResponseSchema = z.object({ message: z.string(), user: ownUserSchema });
export type MeResponse = z.infer<typeof meResponseSchema>;

export const publicUserResponseSchema = z.object({ message: z.string(), user: publicUserSchema });
export type PublicUserResponse = z.infer<typeof publicUserResponseSchema>;

export const userListResponseSchema = z.object({
  message: z.string(),
  users: z.array(publicUserSchema),
  nextCursor: z.string().nullable(),
});
export type UserListResponse = z.infer<typeof userListResponseSchema>;

export const postListResponseSchema = z.object({
  /** Present on a user's posts, absent on the main feed. */
  message: z.string().optional(),
  posts: z.array(postSchema),
  results: z.number().int().nonnegative(),
  nextCursor: z.string().nullable(),
});
export type PostListResponse = z.infer<typeof postListResponseSchema>;

export const postResponseSchema = z.object({ message: z.string(), post: postSchema });
export type PostResponse = z.infer<typeof postResponseSchema>;

export const postDetailResponseSchema = z.object({ post: postSchema });
export type PostDetailResponse = z.infer<typeof postDetailResponseSchema>;

export const likesResponseSchema = z.object({
  message: z.string(),
  results: z.number().int().nonnegative(),
  likes: z.array(likeSchema),
});
export type LikesResponse = z.infer<typeof likesResponseSchema>;

export const commentsResponseSchema = z.object({
  message: z.string(),
  results: z.number().int().nonnegative(),
  comment: z.array(commentSchema),
});
export type CommentsResponse = z.infer<typeof commentsResponseSchema>;
