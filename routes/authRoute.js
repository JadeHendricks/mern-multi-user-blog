const express = require('express');
const router = express.Router();
const asyncHandler = require('../lib/asyncHandler');
const authLimiter = require('../lib/authLimiter');
const authController = require('../controllers/authController');
const { runValidation } = require('../validators/index');
const { userRegisterValidator, userloginValidator, forgotPasswordValidator, resetPasswordValidator } = require('../validators/auth');

router.post('/register', authLimiter(), userRegisterValidator, runValidation, asyncHandler(authController.register));
router.post('/account-activation', authLimiter(), asyncHandler(authController.accountActivation));
router.get('/account-activation/:token', asyncHandler(authController.activationPreview));
router.post('/login', authLimiter(), userloginValidator, runValidation, asyncHandler(authController.login));

router.put('/forgot-password', authLimiter(), forgotPasswordValidator, runValidation, asyncHandler(authController.forgotPassword));
router.put('/reset-password', authLimiter(), resetPasswordValidator, runValidation, asyncHandler(authController.resetPassword));

router.get('/isloggedin', asyncHandler(authController.isLoggedIn));
router.post('/logout', asyncHandler(authController.logout));
router.get('/logout', asyncHandler(authController.logoutDeprecated));

module.exports = router;