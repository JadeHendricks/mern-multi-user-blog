const express = require('express');
const router = express.Router();
const asyncHandler = require('../lib/asyncHandler');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { runValidation } = require('../validators/index');
const { updateMeValidator, updateSocialsValidator } = require('../validators/user');

router
    .route('/me')
    .get(authController.protect, asyncHandler(userController.getMe))
    .put(authController.protect, userController.uploadUserAvatar, updateMeValidator, runValidation, asyncHandler(userController.updateMe));

router
    .route('/')
    .get(asyncHandler(userController.getAllUsers))

router
    .route('/:id')
    .get(asyncHandler(userController.getUser));

router
    .route('/:id/socials')
    .put(authController.protect, updateSocialsValidator, runValidation, asyncHandler(userController.updateUserSocials));

//admin only example
//router.put('/admin', requireSignin, adminOnlyRoutes, updateUser);

module.exports = router;