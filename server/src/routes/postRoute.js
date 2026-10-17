import express from 'express';
import asyncHandler from '../lib/asyncHandler.js';
import { uploadPostPhoto } from '../controllers/postController.js';
import { runValidation } from '../validators/index.js';
import { addCommentValidator, updatePostValidator, createPostValidator } from '../validators/post.js';

export default function createPostRouter({ auth, post }) {
    const router = express.Router();

    router
        .route('/')
        .get(asyncHandler(post.getAllPosts))
        .post(auth.protect, uploadPostPhoto, createPostValidator, runValidation, asyncHandler(post.createPost));

    router
        .route('/user/:id')
        .get(asyncHandler(post.getAllUsersPosts));

    router
        .route('/comment/:id')
        .post(auth.protect, addCommentValidator, runValidation, asyncHandler(post.addComment));

    router
        .route('/comment/:id/:comment_id')
        .delete(auth.protect, asyncHandler(post.deleteComment));

    router
        .route('/like/:id')
        .put(auth.protect, asyncHandler(post.likePost))

    router
        .route('/unlike/:id')
        .put(auth.protect, asyncHandler(post.unlikePost))

    router
        .route('/:id')
        .get(asyncHandler(post.getPost))
        .put(auth.protect, uploadPostPhoto, updatePostValidator, runValidation, asyncHandler(post.editPost))
        .delete(auth.protect, asyncHandler(post.deletePost));

    return router;
}
