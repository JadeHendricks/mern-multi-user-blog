import { makeUpload, removeStoredFile } from '../../lib/upload.js';
import { parsePageQuery } from '../../lib/pagination.js';

export const uploadUserAvatar = makeUpload({ subdir: 'users', prefix: 'user', field: 'avatar' });

export const createUserController = ({ store }) => {
    const getMe = async (req, res) => {
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
    }

    const getUser = async (req, res) => {
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
    }

    const getAllUsers = async (req, res) => {
        // Pending (not yet activated) accounts are never listed by the repo
        const { items: users, nextCursor } = await store.users.listPublic(parsePageQuery(req.query));

        res.status(200).json({
            message: 'success',
            users,
            nextCursor
        });
    }

    const updateMe = async (req, res) => {
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
    }

    const updateUserSocials = async (req, res) => {
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
    }

    return { getMe, getUser, getAllUsers, updateMe, updateUserSocials };
}
