import express from 'express';
import asyncHandler from '../lib/asyncHandler.js';
import authLimiter from '../lib/authLimiter.js';
import * as authController from '../controllers/authController.js';
import { runValidation } from '../validators/index.js';
import { userRegisterValidator, userloginValidator, forgotPasswordValidator, resetPasswordValidator } from '../validators/auth.js';
const router = express.Router();

router.post('/register', authLimiter(), userRegisterValidator, runValidation, asyncHandler(authController.register));
router.post('/account-activation', authLimiter(), asyncHandler(authController.accountActivation));
router.get('/account-activation/:token', asyncHandler(authController.activationPreview));
router.post('/login', authLimiter(), userloginValidator, runValidation, asyncHandler(authController.login));

router.put('/forgot-password', authLimiter(), forgotPasswordValidator, runValidation, asyncHandler(authController.forgotPassword));
router.put('/reset-password', authLimiter(), resetPasswordValidator, runValidation, asyncHandler(authController.resetPassword));

router.get('/isloggedin', asyncHandler(authController.isLoggedIn));
router.post('/logout', asyncHandler(authController.logout));
router.get('/logout', asyncHandler(authController.logoutDeprecated));

export default router;