import express from 'express';
import authLimiter from '../../lib/authLimiter.js';
import { runValidation } from '../../lib/validate.js';
import type { AuthController } from './controller.js';
import {
  forgotPasswordValidator,
  resetPasswordValidator,
  userloginValidator,
  userRegisterValidator,
} from './schema.js';

export default function createAuthRouter({ auth }: { auth: AuthController }): express.Router {
  const router = express.Router();

  router.post('/register', authLimiter(), userRegisterValidator, runValidation, auth.register);
  router.post('/account-activation', authLimiter(), auth.accountActivation);
  router.get('/account-activation/:token', auth.activationPreview);
  router.post('/login', authLimiter(), userloginValidator, runValidation, auth.login);
  router.put(
    '/forgot-password',
    authLimiter(),
    forgotPasswordValidator,
    runValidation,
    auth.forgotPassword,
  );
  router.put(
    '/reset-password',
    authLimiter(),
    resetPasswordValidator,
    runValidation,
    auth.resetPassword,
  );
  router.get('/isloggedin', auth.isLoggedIn);
  router.post('/logout', auth.logout);
  router.get('/logout', auth.logoutDeprecated);

  return router;
}
