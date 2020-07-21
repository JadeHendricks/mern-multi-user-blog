const User = require('../models/UserModel');

exports.getMe = async (req, res) => {
    console.log(req.user);
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(400).json({
                message: 'User not found!'
            });
        }

        res.status(200).json({
            message: 'success',
            user
        });

    } catch (err) {
        console.error(err);
        res.status(400).json({
            message: err
        });
    }
}

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(400).json({
                message: 'User not found!'
            });
        }

        res.status(200).json({
            message: 'success',
            user
        });

    } catch (err) {
        console.error(err);
        res.status(400).json({
            message: err
        });
    }
}

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        if (!users) {
            return res.status(404).json({
                message: 'No user have been found!'
            });
        }

        res.status(200).json({
            message: 'success',
            users
        });

    } catch (err) {
        console.error(err);
        res.status(404).json({
            message: err
        });
    }
}