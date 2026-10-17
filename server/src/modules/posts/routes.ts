import express from 'express';
import { runValidation } from '../../lib/validate.js';
import type { AuthController } from '../auth/controller.js';
import { uploadPostPhoto } from './controller.js';
import type { PostController } from './controller.js';
import { addCommentValidator, createPostValidator, updatePostValidator } from './schema.js';

export default function createPostRouter({
  auth,
  post,
}: {
  auth: AuthController;
  post: PostController;
}): express.Router {
  const router = express.Router();

  router
    .route('/')
    .get(post.getAllPosts)
    .post(auth.protect, uploadPostPhoto, createPostValidator, runValidation, post.createPost);

  router.route('/user/:id').get(post.getAllUsersPosts);

  router
    .route('/comment/:id')
    .post(auth.protect, addCommentValidator, runValidation, post.addComment);

  router.route('/comment/:id/:comment_id').delete(auth.protect, post.deleteComment);

  router.route('/like/:id').put(auth.protect, post.likePost);

  router.route('/unlike/:id').put(auth.protect, post.unlikePost);

  router
    .route('/:id')
    .get(post.getPost)
    .put(auth.protect, uploadPostPhoto, updatePostValidator, runValidation, post.editPost)
    .delete(auth.protect, post.deletePost);

  return router;
}
