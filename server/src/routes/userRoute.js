import express from 'express';
import asyncHandler from '../lib/asyncHandler.js';
import * as userController from '../controllers/userController.js';
import * as authController from '../controllers/authController.js';
import { runValidation } from '../validators/index.js';
import { updateMeValidator, updateSocialsValidator } from '../validators/user.js';
const router = express.Router();

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

export default router;