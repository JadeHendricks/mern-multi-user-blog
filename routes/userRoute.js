const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

router
    .route('/me')
    .get(authController.protect, userController.getMe)
    .put(authController.protect, userController.uploadUserAvatar, userController.updateMe);

router
    .route('/')
    .get(userController.getAllUsers)

router
    .route('/:id')
    .get(userController.getUser);

router
    .route('/:id/socials')
    .put(authController.protect, userController.updateUserSocials);

//admin only example
//router.put('/admin', requireSignin, adminOnlyRoutes, updateUser);

module.exports = router;