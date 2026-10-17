import express from 'express';
import { uploadUserAvatar } from '../controllers/userController.js';
import { runValidation } from '../validators/index.js';
import { updateMeValidator, updateSocialsValidator } from '../validators/user.js';

export default function createUserRouter({ auth, user }) {
    const router = express.Router();

    router
        .route('/me')
        .get(auth.protect, user.getMe)
        .put(auth.protect, uploadUserAvatar, updateMeValidator, runValidation, user.updateMe);

    router
        .route('/')
        .get(user.getAllUsers)

    router
        .route('/:id')
        .get(user.getUser);

    router
        .route('/:id/socials')
        .put(auth.protect, updateSocialsValidator, runValidation, user.updateUserSocials);

    //admin only example
    //router.put('/admin', requireSignin, adminOnlyRoutes, updateUser);

    return router;
}
