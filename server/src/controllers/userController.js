import { makeUpload, removeStoredFile } from '../lib/upload.js';

export const uploadUserAvatar = makeUpload({ subdir: 'users', prefix: 'user', field: 'avatar' });

export const createUserController = ({ store }) => {
    const getMe = async (req, res) => {
        try {
            const user = await store.users.findById(req.user._id);
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

    const getUser = async (req, res) => {
        try {
            // Public view: no email, role or timestamps beyond createdAt
            const user = await store.users.findPublicById(req.params.id);
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

    const getAllUsers = async (req, res) => {
        try {
            // Pending (not yet activated) accounts are never listed by the repo
            const { items: users } = await store.users.listPublic();

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

    const updateMe = async (req, res) => {
        try {
            const { name } = req.body;

            const userFields = {};
            if (name) userFields.name = name;
            if (req.file) userFields.avatar = req.file.filename;

            const user = await store.users.updateProfile(req.user._id, userFields);
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

    const updateUserSocials = async (req, res) => {
        try {
            const { facebook, linkedin, twitter } = req.body;

            // Only the networks that were sent change; an empty string clears that one field.
            const user = await store.users.updateSocials(req.user._id, { facebook, linkedin, twitter });
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

    return { getMe, getUser, getAllUsers, updateMe, updateUserSocials };
}
