import express from 'express';
import { uploadPostPhoto } from '../controllers/postController.js';
import { runValidation } from '../validators/index.js';
import { addCommentValidator, updatePostValidator, createPostValidator } from '../validators/post.js';

export default function createPostRouter({ auth, post }) {
    const router = express.Router();

    router
        .route('/')
        .get(post.getAllPosts)
        .post(auth.protect, uploadPostPhoto, createPostValidator, runValidation, post.createPost);

    router
        .route('/user/:id')
        .get(post.getAllUsersPosts);

    router
        .route('/comment/:id')
        .post(auth.protect, addCommentValidator, runValidation, post.addComment);

    router
        .route('/comment/:id/:comment_id')
        .delete(auth.protect, post.deleteComment);

    router
        .route('/like/:id')
        .put(auth.protect, post.likePost)

    router
        .route('/unlike/:id')
        .put(auth.protect, post.unlikePost)

    router
        .route('/:id')
        .get(post.getPost)
        .put(auth.protect, uploadPostPhoto, updatePostValidator, runValidation, post.editPost)
        .delete(auth.protect, post.deletePost);

    return router;
}
