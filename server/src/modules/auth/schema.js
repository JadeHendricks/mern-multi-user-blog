import { check } from 'express-validator';

export const userRegisterValidator = [
    check('name').not().isEmpty().withMessage('Name is required'),
    check('email').isEmail().withMessage('Must be a valid email address'),
    check('password').isLength({ min: 6 }).withMessage('Password must be atleast 6 characters long')
];

export const userloginValidator = [
    check('email').isEmail().withMessage('Invalid Credentials'),
    check('password').isLength({ min: 6 }).withMessage('Invalid Credentials')
];

export const forgotPasswordValidator = [
    check('email').not().isEmpty().isEmail().withMessage('Must be a valid email address'),
];

export const resetPasswordValidator = [
    check('newPassword').not().isEmpty().isLength({ min: 6 }).withMessage('Password must be atleast 6 characters long'),
    check('resetPasswordLink').not().isEmpty().withMessage('Reset link is required')
];