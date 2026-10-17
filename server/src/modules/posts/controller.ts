import type {
  AddCommentRequest,
  CommentsResponse,
  CreatePostRequest,
  LikesResponse,
  MessageResponse,
  PostDetailResponse,
  PostListResponse,
  PostResponse,
  UpdatePostRequest,
} from '@mern-blog/shared';
import type { Request, Response } from 'express';
import { parsePageQuery } from '../../lib/pagination.js';
import { requireUser } from '../../lib/require-user.js';
import { sendJson } from '../../lib/respond.js';
import { makeUpload, removeStoredFile } from '../../lib/upload.js';
import type { PostFields, Store } from '../../store/types.js';

export const uploadPostPhoto = makeUpload({ subdir: 'posts', prefix: 'post', field: 'image' });

type Params = Record<string, string>;
interface IdParams {
  id: string;
}
interface CommentParams {
  id: string;
  comment_id: string;
}

// The two comment-delete failures answer { msg } instead of { message }. The client and the API
// tests depend on that, so the key stays.
interface LegacyMsgBody {
  msg: string;
}

export const createPostController = ({ store }: { store: Store }) => {
  const getAllPosts = async (
    req: Request<Params, PostListResponse>,
    res: Response<PostListResponse>,
  ): Promise<void> => {
    const { items: posts, nextCursor } = await store.posts.list(parsePageQuery(req.query));
    sendJson(res, 200, {
      results: posts.length,
      posts,
      nextCursor,
    });
  };

  const getPost = async (
    req: Request<IdParams, PostDetailResponse | MessageResponse>,
    res: Response<PostDetailResponse | MessageResponse>,
  ): Promise<void> => {
    // An unknown or malformed id both come back as null
    const post = await store.posts.findById(req.params.id);
    if (!post) {
      res.status(404).json({
        message: 'Post not found',
      });
      return;
    }
    sendJson(res, 200, {
      post,
    });
  };

  // `tag` is not part of the request schema (it is optional), so the body type adds it.
  const createPost = async (
    req: Request<Params, PostResponse, CreatePostRequest & { tag?: string }>,
    res: Response<PostResponse>,
  ): Promise<void> => {
    const { title, tag, description } = req.body;
    // title and description go straight to the store: a missing or empty one is answered there with
    // the same "required" message as leaving it out would give. An empty tag falls back to the default.
    const post = await store.posts.create({
      user: requireUser(req)._id,
      title,
      tag,
      description,
      image: req.file?.filename,
    });
    sendJson(res, 201, {
      message: `Post "${title}", has been created`,
      post,
    });
  };

  const deletePost = async (
    req: Request<IdParams, MessageResponse>,
    res: Response<MessageResponse>,
  ): Promise<void> => {
    const existing = await store.posts.getOwnerAndImage(req.params.id);
    if (!existing) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }
    // Check user
    if (existing.user !== requireUser(req)._id) {
      res.status(401).json({ message: 'This post does not belong to you.' });
      return;
    }
    await store.posts.delete(req.params.id);
    await removeStoredFile('posts', existing.image);
    res.status(200).json({ message: 'Post has been deleted.' });
  };

  const getAllUsersPosts = async (
    req: Request<IdParams, PostListResponse>,
    res: Response<PostListResponse>,
  ): Promise<void> => {
    const { items: posts, nextCursor } = await store.posts.listByUser(
      req.params.id,
      parsePageQuery(req.query),
    );
    sendJson(res, 200, {
      message: 'success',
      results: posts.length,
      posts,
      nextCursor,
    });
  };

  const editPost = async (
    req: Request<IdParams, PostResponse | MessageResponse, UpdatePostRequest & { tag?: string }>,
    res: Response<PostResponse | MessageResponse>,
  ): Promise<void> => {
    // The post id comes from the URL only; an id in the body is ignored.
    const { title, tag, description } = req.body;
    const postFields: PostFields = {};
    if (title) postFields.title = title;
    if (tag) postFields.tag = tag;
    if (description) postFields.description = description;
    if (req.file) postFields.image = req.file.filename;
    // A malformed id is simply "not found" in the repo
    const existing = await store.posts.getOwnerAndImage(req.params.id);
    if (!existing) {
      res.status(404).json({
        message: 'No post found with that ID',
      });
      return;
    }
    if (existing.user !== requireUser(req)._id) {
      res.status(403).json({ message: 'This post does not belong to you.' });
      return;
    }
    const post = await store.posts.update(req.params.id, postFields);
    if (!post) {
      res.status(404).json({
        message: 'No post found with that ID',
      });
      return;
    }
    // The replaced image is no longer referenced, so drop it from disk
    if (req.file) await removeStoredFile('posts', existing.image);
    sendJson(res, 200, {
      message: 'Post has been updated',
      post,
    });
  };

  // Like and unlike are single atomic repo calls, so two parallel requests from one user cannot both add a like.
  const likePost = async (
    req: Request<IdParams, LikesResponse | MessageResponse>,
    res: Response<LikesResponse | MessageResponse>,
  ): Promise<void> => {
    const result = await store.posts.like(req.params.id, requireUser(req)._id);
    if (result.status !== 'liked') {
      if (result.status === 'not-found') {
        res.status(404).json({ message: 'Post not found' });
      } else {
        res.status(400).json({
          message: 'Post has already been liked.',
        });
      }
      return;
    }
    sendJson(res, 200, {
      message: 'Post has been liked.',
      likes: result.likes,
      results: result.likes.length,
    });
  };

  const unlikePost = async (
    req: Request<IdParams, LikesResponse | MessageResponse>,
    res: Response<LikesResponse | MessageResponse>,
  ): Promise<void> => {
    const result = await store.posts.unlike(req.params.id, requireUser(req)._id);
    if (result.status !== 'unliked') {
      if (result.status === 'not-found') {
        res.status(404).json({ message: 'Post not found' });
      } else {
        res.status(400).json({
          message: 'Post has not yet been liked.',
        });
      }
      return;
    }
    sendJson(res, 200, {
      message: 'Post has been disliked.',
      likes: result.likes,
      results: result.likes.length,
    });
  };

  const addComment = async (
    req: Request<IdParams, CommentsResponse | MessageResponse, AddCommentRequest>,
    res: Response<CommentsResponse | MessageResponse>,
  ): Promise<void> => {
    const comments = await store.posts.addComment(
      req.params.id,
      requireUser(req)._id,
      req.body.comment,
    );
    if (!comments) {
      res.status(404).json({
        message: 'User or Post data not found.',
      });
      return;
    }
    sendJson(res, 201, {
      message: 'Comment has been added.',
      comment: comments,
      results: comments.length,
    });
  };

  const deleteComment = async (
    req: Request<CommentParams, MessageResponse | LegacyMsgBody>,
    res: Response<MessageResponse | LegacyMsgBody>,
  ): Promise<void> => {
    const { id, comment_id: commentId } = req.params;
    if (!(await store.posts.exists(id))) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    const comment = await store.posts.getComment(id, commentId);
    if (!comment) {
      res.status(404).json({ msg: 'Comment does not exist' });
      return;
    }
    if (comment.userId !== requireUser(req)._id) {
      res.status(401).json({ msg: 'User not authorized' });
      return;
    }
    const outcome = await store.posts.removeComment(id, commentId);
    if (outcome === 'post-not-found') {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    if (outcome === 'comment-not-found') {
      res.status(404).json({ msg: 'Comment does not exist' });
      return;
    }
    res.status(200).json({
      message: 'Comment has been deleted.',
    });
  };

  return {
    getAllPosts,
    getPost,
    createPost,
    deletePost,
    getAllUsersPosts,
    editPost,
    likePost,
    unlikePost,
    addComment,
    deleteComment,
  };
};

export type PostController = ReturnType<typeof createPostController>;
