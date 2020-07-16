const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

router
    .route('/')
    .get(authController.protect, userController.getUser)
    .put(authController.protect, userController.updateUser);

//admin only example
//router.put('/admin', requireSignin, adminOnlyRoutes, updateUser);

module.exports = router;