import express from 'express';
import { runValidation } from '../../lib/validate.js';
import type { AuthController } from '../auth/controller.js';
import { uploadUserAvatar } from './controller.js';
import type { UserController } from './controller.js';
import { updateMeValidator, updateSocialsValidator } from './schema.js';

export default function createUserRouter({
  auth,
  user,
}: {
  auth: AuthController;
  user: UserController;
}): express.Router {
  const router = express.Router();

  router
    .route('/me')
    .get(auth.protect, user.getMe)
    .put(auth.protect, uploadUserAvatar, updateMeValidator, runValidation, user.updateMe);

  router.route('/').get(user.getAllUsers);

  router.route('/:id').get(user.getUser);

  router
    .route('/:id/socials')
    .put(auth.protect, updateSocialsValidator, runValidation, user.updateUserSocials);

  //admin only example
  //router.put('/admin', requireSignin, adminOnlyRoutes, updateUser);

  return router;
}
