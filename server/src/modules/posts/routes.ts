import {
  addCommentRequestSchema,
  createPostRequestSchema,
  updatePostRequestSchema,
} from '@mern-blog/shared';
import express from 'express';
import { validateBody } from '../../lib/validate.js';
import type { AuthController } from '../auth/controller.js';
import { uploadPostPhoto } from './controller.js';
import type { PostController } from './controller.js';

export default function createPostRouter({
  auth,
  post,
}: {
  auth: AuthController;
  post: PostController;
}): express.Router {
  const router = express.Router();

  // Multipart bodies are only parsed by multer, so the photo upload runs before the validation.
  router
    .route('/')
    .get(post.getAllPosts)
    .post(auth.protect, uploadPostPhoto, validateBody(createPostRequestSchema), post.createPost);

  router.route('/user/:id').get(post.getAllUsersPosts);

  router
    .route('/comment/:id')
    .post(auth.protect, validateBody(addCommentRequestSchema), post.addComment);

  router.route('/comment/:id/:comment_id').delete(auth.protect, post.deleteComment);

  router.route('/like/:id').put(auth.protect, post.likePost);

  router.route('/unlike/:id').put(auth.protect, post.unlikePost);

  router
    .route('/:id')
    .get(post.getPost)
    .put(auth.protect, uploadPostPhoto, validateBody(updatePostRequestSchema), post.editPost)
    .delete(auth.protect, post.deletePost);

  return router;
}
