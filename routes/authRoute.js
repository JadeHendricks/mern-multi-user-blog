const express = require('express');
const router = express.Router();
const { register, logout, protect, login, isLoggedIn, accountActivation, forgotPassword, resetPassword, googleLogin, facebookLogin } = require('../controllers/authController');
const { runValidation } = require('../validators/index');
const { 
    userRegisterValidator, 
    userloginValidator, 
    forgotPasswordValidator, 
    resetPasswordValidator } = require('../validators/auth');

router.post('/register', userRegisterValidator, runValidation, register);
router.post('/account-activation', accountActivation);
router.post('/login', userloginValidator, runValidation, login);
router.post('/google-login', googleLogin);
router.post('/facebook-login', facebookLogin);

router.put('/forgot-password', forgotPasswordValidator, runValidation, forgotPassword);
router.put('/reset-password', resetPasswordValidator, runValidation, resetPassword);

router.get('/isloggedin', isLoggedIn);
router.get('/logout', logout);

module.exports = router;