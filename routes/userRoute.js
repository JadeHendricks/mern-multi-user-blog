const express = require('express');
const multer = require('multer');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const upload = multer({ dest: 'client/src/assets/images/users' });


router
    .route('/me')
    .get(authController.protect, userController.getMe)
    .put(authController.protect, userController.updateMe);

router
    .route('/')
    .get(userController.getAllUsers)

router
    .route('/:id')
    .get(userController.getUser);

router
    .route('/:id/socials')
    .put(authController.protect, userController.updateUserSocials);

//admin only example
//router.put('/admin', requireSignin, adminOnlyRoutes, updateUser);

module.exports = router;