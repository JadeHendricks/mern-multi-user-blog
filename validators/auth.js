const { check } = require('express-validator');

exports.userRegisterValidator = [
    check('name').not().isEmpty().withMessage('Name is required'),
    check('email').isEmail().withMessage('Must be a valid email address'),
    check('password').isLength({ min: 6 }).withMessage('Password must be atleast 6 characters long')
];

exports.userloginValidator = [
    check('email').isEmail().withMessage('Invalid Credentials'),
    check('password').isLength({ min: 6 }).withMessage('Invalid Credentials')
];

exports.forgotPasswordValidator = [
    check('email').not().isEmpty().isEmail().withMessage('Must be a valid email address'),
];

exports.resetPasswordValidator = [
    check('newPassword').not().isEmpty().isLength({ min: 6 }).withMessage('Password must be atleast 6 characters long')
];