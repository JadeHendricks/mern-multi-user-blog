import express from 'express';
import asyncHandler from '../lib/asyncHandler.js';
import * as postController from '../controllers/postController.js';
import * as authController from '../controllers/authController.js';
import { runValidation } from '../validators/index.js';
import { addCommentValidator, updatePostValidator, createPostValidator } from '../validators/post.js';
const router = express.Router();

router
    .route('/')
    .get(asyncHandler(postController.getAllPosts))
    .post(authController.protect, postController.uploadPostPhoto, createPostValidator, runValidation, asyncHandler(postController.createPost));

router
    .route('/user/:id')
    .get(asyncHandler(postController.getAllUsersPosts));

router
    .route('/comment/:id')
    .post(authController.protect, addCommentValidator, runValidation, asyncHandler(postController.addComment));

router
    .route('/comment/:id/:comment_id')
    .delete(authController.protect, asyncHandler(postController.deleteComment));

router	
    .route('/like/:id')	
    .put(authController.protect, asyncHandler(postController.likePost))	

router	
    .route('/unlike/:id')	
    .put(authController.protect, asyncHandler(postController.unlikePost))

router
    .route('/:id')
    .get(asyncHandler(postController.getPost))
    .put(authController.protect, postController.uploadPostPhoto, updatePostValidator, runValidation, asyncHandler(postController.editPost))
    .delete(authController.protect, asyncHandler(postController.deletePost));

export default router;