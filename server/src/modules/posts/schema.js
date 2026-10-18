import { check } from 'express-validator';

export const addCommentValidator = [
    check('comment').not().isEmpty().withMessage('A comment is required.')
];

export const updatePostValidator = [
    check('title').not().isEmpty().withMessage('Title is required.'),
    check('description').isLength({ min: 50 }).withMessage('Description must be atleast 50 characters long.')
];

export const createPostValidator = [
    check('title').not().isEmpty().withMessage('Title is required.'),
    check('description').isLength({ min: 50 }).withMessage('Description must be atleast 50 characters long.')
];