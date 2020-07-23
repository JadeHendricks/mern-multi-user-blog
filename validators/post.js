const { check } = require('express-validator');

exports.updatePostValidator = [
    check('title').not().isEmpty().withMessage('Title is required'),
    check('tag').not().isEmpty().withMessage('Tag for the post is required'),
    check('description').isLength({ min: 50 }).withMessage('Password must be atleast 50 characters long')
];

exports.createPostValidator = [
    check('title').not().isEmpty().withMessage('Title is required'),
    check('tag').not().isEmpty().withMessage('Tag for the post is required'),
    check('description').isLength({ min: 50 }).withMessage('Password must be atleast 50 characters long')
];