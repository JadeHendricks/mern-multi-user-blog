import { User } from '../models/UserModel.js';
import { makeUpload, removeStoredFile } from '../lib/upload.js';

const PUBLIC_FIELDS = '_id name avatar socials createdAt';

export const uploadUserAvatar = makeUpload({ subdir: 'users', prefix: 'user', field: 'avatar' });

export const getMe = async (req, res) => {
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

export const getUser = async (req, res) => {
    try {
        // Public view: no email, role or timestamps beyond createdAt
        const user = await User.findById(req.params.id).select(PUBLIC_FIELDS);
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

export const getAllUsers = async (req, res) => {
    try {
        // Pending (not yet activated) accounts must never be listed
        const users = await User.find({ status: { $ne: 'pending' } }).select(PUBLIC_FIELDS);
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

export const updateMe = async (req, res) => {
    try {
        const { name } = req.body;

        const userFields = {};
        if (name) userFields.name = name;
        if (req.file) userFields.avatar = req.file.filename;

        let user = await User.findOneAndUpdate(
            { _id: req.user.id },
            { $set: userFields },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }
        // req.user still holds the pre-update avatar; the replaced file is no longer referenced
        if (req.file) await removeStoredFile('users', req.user.avatar);

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


export const updateUserSocials = async (req, res) => {
    try {
        const { facebook, linkedin, twitter } = req.body;

        // Dotted $set keys touch only the networks that were sent; an empty string clears that one field.
        const userFields = {};
        if (facebook !== undefined) userFields['socials.facebook'] = facebook;
        if (linkedin !== undefined) userFields['socials.linkedin'] = linkedin;
        if (twitter !== undefined) userFields['socials.twitter'] = twitter;
        let user = await User.findOneAndUpdate(
            { _id: req.user.id },
            { $set: userFields },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }
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
