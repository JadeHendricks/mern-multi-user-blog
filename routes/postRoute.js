const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController')
const authController = require('../controllers/authController');

router
    .route('/')
    .get(postController.getAllPosts)
    .post(authController.protect, postController.createPost);

router
    .route('/:id')
    .get(authController.protect, postController.getPost)
    .put(authController.protect, postController.editPost)
    .delete(authController.protect, postController.deletePost);

module.exports = router;