const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController')
const authController = require('../controllers/authController');
const { runValidation } = require('../validators/index');
const { updatePostValidator, createPostValidator } = require('../validators/post');

router
    .route('/')
    .get(postController.getAllPosts)
    .post(createPostValidator, runValidation, authController.protect, postController.createPost);

router
    .route('/user/:id')
    .get(postController.getAllUsersPosts);

router
    .route('/:id')
    .get(authController.protect, postController.getPost)
    .put(updatePostValidator, runValidation, authController.protect, postController.editPost)
    .delete(authController.protect, postController.deletePost);

module.exports = router;