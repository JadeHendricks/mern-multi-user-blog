import { check } from 'express-validator';

export const updateMeValidator = [
    check('name').not().isEmpty().withMessage('Name is required'),
];

// https-only, so a stored social link can never be a javascript: or http: URL
const socialValidator = (field) =>
    check(field)
        .optional({ checkFalsy: true })
        .isString().withMessage(`${field} link must be a text value`)
        .bail()
        .isLength({ max: 200 }).withMessage(`${field} link must be at most 200 characters`)
        .bail()
        .isURL({ protocols: ['https'], require_protocol: true }).withMessage(`${field} link must be a valid https URL`);

export const updateSocialsValidator = [
    socialValidator('facebook'),
    socialValidator('linkedin'),
    socialValidator('twitter'),
];
