const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router
    .route('/')
    .get(userController.getAllUsers)

router
    .route('/:id')
    .get(userController.getUser);

//admin only example
//router.put('/admin', requireSignin, adminOnlyRoutes, updateUser);

module.exports = router;