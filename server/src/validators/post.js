const { check } = require('express-validator');

exports.addCommentValidator = [
    check('comment').not().isEmpty().withMessage('A comment is required.')
];

exports.updatePostValidator = [
    check('title').not().isEmpty().withMessage('Title is required.'),
    check('description').isLength({ min: 50 }).withMessage('Description must be atleast 50 characters long.')
];

exports.createPostValidator = [
    check('title').not().isEmpty().withMessage('Title is required.'),
    check('description').isLength({ min: 50 }).withMessage('Description must be atleast 50 characters long.')
];