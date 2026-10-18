import { updateMeRequestSchema, updateSocialsRequestSchema } from '@mern-blog/shared';
import express from 'express';
import { validateBody } from '../../lib/validate.js';
import type { AuthController } from '../auth/controller.js';
import { uploadUserAvatar } from './controller.js';
import type { UserController } from './controller.js';

export default function createUserRouter({
  auth,
  user,
}: {
  auth: AuthController;
  user: UserController;
}): express.Router {
  const router = express.Router();

  // Multipart bodies are only parsed by multer, so the avatar upload runs before the validation.
  router
    .route('/me')
    .get(auth.protect, user.getMe)
    .put(auth.protect, uploadUserAvatar, validateBody(updateMeRequestSchema), user.updateMe);

  router.route('/').get(user.getAllUsers);

  router.route('/:id').get(user.getUser);

  router
    .route('/:id/socials')
    .put(auth.protect, validateBody(updateSocialsRequestSchema), user.updateUserSocials);

  //admin only example
  //router.put('/admin', requireSignin, adminOnlyRoutes, updateUser);

  return router;
}
