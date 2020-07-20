const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { runValidation } = require('../validators/index');
const { userRegisterValidator, userloginValidator, forgotPasswordValidator, resetPasswordValidator } = require('../validators/auth');

router.post('/register', userRegisterValidator, runValidation, authController.register);
router.post('/account-activation', authController.accountActivation);
router.post('/login', userloginValidator, runValidation, authController.login);

router.put('/forgot-password', forgotPasswordValidator, runValidation, authController.forgotPassword);
router.put('/reset-password', resetPasswordValidator, runValidation, authController.resetPassword);

router.get('/isloggedin', authController.isLoggedIn);
router.get('/logout', authController.logout);

module.exports = router;