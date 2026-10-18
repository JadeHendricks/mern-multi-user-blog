import {
  forgotPasswordRequestSchema,
  loginRequestSchema,
  registerRequestSchema,
  resetPasswordRequestSchema,
} from '@mern-blog/shared';
import express from 'express';
import authLimiter from '../../lib/authLimiter.js';
import { validateBody } from '../../lib/validate.js';
import type { AuthController } from './controller.js';

export default function createAuthRouter({ auth }: { auth: AuthController }): express.Router {
  const router = express.Router();

  router.post('/register', authLimiter(), validateBody(registerRequestSchema), auth.register);
  router.post('/account-activation', authLimiter(), auth.accountActivation);
  router.get('/account-activation/:token', auth.activationPreview);
  router.post('/login', authLimiter(), validateBody(loginRequestSchema), auth.login);
  router.put(
    '/forgot-password',
    authLimiter(),
    validateBody(forgotPasswordRequestSchema),
    auth.forgotPassword,
  );
  router.put(
    '/reset-password',
    authLimiter(),
    validateBody(resetPasswordRequestSchema),
    auth.resetPassword,
  );
  router.get('/isloggedin', auth.isLoggedIn);
  router.post('/logout', auth.logout);
  router.get('/logout', auth.logoutDeprecated);

  return router;
}
