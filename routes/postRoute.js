const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController')
const authController = require('../controllers/authController');

router
    .route('/')
    .get(postController.getAllPosts);

router
    .route('/:id')
    .get(postController.getPost)
    .put(authController.protect, postController.editPost)
    .post(authController.protect, postController.createPost)
    .delete(authController.protect, postController.deletePost);

module.exports = router;