const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController')
const authController = require('../controllers/authController');
const { runValidation } = require('../validators/index');
const { updatePostValidator, createPostValidator } = require('../validators/post');
const { Router } = require('express');

router
    .route('/')
    .get(postController.getAllPosts)
    .post(authController.protect, postController.uploadPostPhoto, postController.createPost);

router
    .route('/user/:id')
    .get(postController.getAllUsersPosts);

router
    .route('/comment/:id')
    .post(authController.protect, postController.addComment);

router
    .route('/comment/:id/:comment_id')
    .delete(authController.protect, postController.deleteComment);

router
    .route('/:id')
    .get(postController.getPost)
    .put(authController.protect, postController.uploadPostPhoto, postController.editPost)
    .delete(authController.protect, postController.deletePost);

module.exports = router;