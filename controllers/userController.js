const User = require('../models/UserModel');

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-__v');
        res.status(200).json({
            status: 'ok',
            users
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            status: 'fail',
            message: 'Server Error'
        });
    }
}

exports.createUser = (req, res) => {
    res.status(500).json({
      status: 'error',
      message: 'This route is not defined! Please use /signup instead'
    });
  };
  