import express from 'express';
import asyncHandler from '../lib/asyncHandler.js';
import { uploadUserAvatar } from '../controllers/userController.js';
import { runValidation } from '../validators/index.js';
import { updateMeValidator, updateSocialsValidator } from '../validators/user.js';

export default function createUserRouter({ auth, user }) {
    const router = express.Router();

    router
        .route('/me')
        .get(auth.protect, asyncHandler(user.getMe))
        .put(auth.protect, uploadUserAvatar, updateMeValidator, runValidation, asyncHandler(user.updateMe));

    router
        .route('/')
        .get(asyncHandler(user.getAllUsers))

    router
        .route('/:id')
        .get(asyncHandler(user.getUser));

    router
        .route('/:id/socials')
        .put(auth.protect, updateSocialsValidator, runValidation, asyncHandler(user.updateUserSocials));

    //admin only example
    //router.put('/admin', requireSignin, adminOnlyRoutes, updateUser);

    return router;
}
