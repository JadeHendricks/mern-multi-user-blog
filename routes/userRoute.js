const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { runValidation } = require('../validators/index');
const { updateMeValidator } = require('../validators/user');

router
    .route('/me')
    .get(authController.protect, userController.getMe)
    .put(authController.protect, userController.uploadUserAvatar, updateMeValidator, runValidation, userController.updateMe);

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