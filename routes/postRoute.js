const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController')
const authController = require('../controllers/authController');
const { runValidation } = require('../validators/index');
const { addCommentValidator, updatePostValidator, createPostValidator } = require('../validators/post');

router
    .route('/')
    .get(postController.getAllPosts)
    .post(authController.protect, postController.uploadPostPhoto, createPostValidator, runValidation, postController.createPost);

router
    .route('/user/:id')
    .get(postController.getAllUsersPosts);

router
    .route('/comment/:id')
    .post(authController.protect, addCommentValidator, runValidation, postController.addComment);

router
    .route('/comment/:id/:comment_id')
    .delete(authController.protect, postController.deleteComment);

router
    .route('/:id')
    .get(postController.getPost)
    .put(authController.protect, postController.uploadPostPhoto, updatePostValidator, runValidation, postController.editPost)
    .delete(authController.protect, postController.deletePost);

module.exports = router;