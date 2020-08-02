const User = require('../models/UserModel');
const multer = require('multer');


const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'client/src/assets/images/users')
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split('/')[1];
        cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
    }
});

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb('Not an Image! Please upload only images.', false);
    }
}

const upload = multer({ 
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadUserAvatar = upload.single('avatar');

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
        res.status(500).json({
            message: err.message
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
        res.status(500).json({
            message: err.message
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
        res.status(500).json({
            message: err.message
        });
    }
}

exports.updateMe = async (req, res) => {
    try {
        const { name } = req.body;

        const userFields = {};
        if (name) userFields.name = name;
        if (req.file) userFields.avatar = req.file.filename;

        let user = await User.findOneAndUpdate(
            { _id: req.user.id },
            { $set: userFields },
            { new: true, upsert: true }
        );;

        res.status(200).json({
            message: 'User details has been updated',
            user
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: err.message
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
        console.error(err);
        res.status(500).json({
            message: err.message
        });
    }
}
