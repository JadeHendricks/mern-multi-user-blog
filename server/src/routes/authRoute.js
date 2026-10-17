import express from 'express';
import asyncHandler from '../lib/asyncHandler.js';
import authLimiter from '../lib/authLimiter.js';
import { runValidation } from '../validators/index.js';
import { userRegisterValidator, userloginValidator, forgotPasswordValidator, resetPasswordValidator } from '../validators/auth.js';

export default function createAuthRouter({ auth }) {
    const router = express.Router();

    router.post('/register', authLimiter(), userRegisterValidator, runValidation, asyncHandler(auth.register));
    router.post('/account-activation', authLimiter(), asyncHandler(auth.accountActivation));
    router.get('/account-activation/:token', asyncHandler(auth.activationPreview));
    router.post('/login', authLimiter(), userloginValidator, runValidation, asyncHandler(auth.login));
    router.put('/forgot-password', authLimiter(), forgotPasswordValidator, runValidation, asyncHandler(auth.forgotPassword));
    router.put('/reset-password', authLimiter(), resetPasswordValidator, runValidation, asyncHandler(auth.resetPassword));
    router.get('/isloggedin', asyncHandler(auth.isLoggedIn));
    router.post('/logout', asyncHandler(auth.logout));
    router.get('/logout', asyncHandler(auth.logoutDeprecated));

    return router;
}
