const User = require('../models/UserModel');

exports.getMe = async (req, res) => {
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
exports.updateUserSocials = async (req, res) => {
    try {
        const { facebook, linkedin, twitter } = req.body;

        const userFields = {};
        userFields.socials = {};

        if (facebook) userFields.socials.facebook = facebook;
        if (linkedin) userFields.socials.linkedin = linkedin;
        if (twitter) userFields.socials.twitter = twitter;

        let user = await User.findOneAndUpdate(
            { _id: req.user.id },
            { $set: userFields },
            { new: true, upsert: true }
        );

        res.status(200).json({
            message: 'Your socials have been updated',
            user
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
}
