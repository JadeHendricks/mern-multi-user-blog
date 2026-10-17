import { makeUpload, removeStoredFile } from '../lib/upload.js';

export const uploadPostPhoto = makeUpload({ subdir: 'posts', prefix: 'post', field: 'image' });

export const createPostController = ({ store }) => {
    const getAllPosts = async (req, res) => {
        const { items: posts } = await store.posts.list();

        res.status(200).json({
            results: posts.length,
            posts
        });
    }

    const getPost = async (req, res) => {
        // An unknown or malformed id both come back as null
        const post = await store.posts.findById(req.params.id);
        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        res.status(200).json({
            post
        });
    }

    const createPost = async (req, res) => {
        const { title, tag, description } = req.body;
        const postFields = {};

        if (title) postFields.title = title;
        if (tag) postFields.tag = tag;
        if (description) postFields.description = description;
        if (req.user._id) postFields.user = req.user._id;
        if (req.file) postFields.image = req.file.filename;

        const post = await store.posts.create(postFields);

        res.status(201).json({
            message: `Post "${title}", has been created`,
            post
        });
    }

    const deletePost = async (req, res) => {
        const existing = await store.posts.getOwnerAndImage(req.params.id);

        if (!existing) {
            return res.status(404).json({ message: 'Post not found.' })
        }
        // Check user
        if (existing.user !== req.user._id) {
            return res.status(401).json({ message: 'This post does not belong to you.' });
        }
        await store.posts.delete(req.params.id);
        await removeStoredFile('posts', existing.image);
        res.status(200).json({ message: 'Post has been deleted.' });
    }

    const getAllUsersPosts = async (req, res) => {
        const { items: posts } = await store.posts.listByUser(req.params.id);
        res.status(200).json({
            message: 'success',
            results: posts.length,
            posts
        });
    }

    const editPost = async (req, res) => {
        // The post id comes from the URL only; an id in the body is ignored.
        const { title, tag, description } = req.body;
        const postFields = {};
        if (title) postFields.title = title;
        if (tag) postFields.tag = tag;
        if (description) postFields.description = description;
        if (req.file) postFields.image = req.file.filename;
        // A malformed id is simply "not found" in the repo
        const existing = await store.posts.getOwnerAndImage(req.params.id);
        if (!existing) {
            return res.status(404).json({
                message: 'No post found with that ID'
            });
        }
        if (existing.user !== req.user._id) {
            return res.status(403).json({ message: 'This post does not belong to you.' });
        }
        const post = await store.posts.update(req.params.id, postFields);
        if (!post) {
            return res.status(404).json({
                message: 'No post found with that ID'
            });
        }
        // The replaced image is no longer referenced, so drop it from disk
        if (req.file) await removeStoredFile('posts', existing.image);
        res.status(200).json({
            message: 'Post has been updated',
            post
        });
    }

    // Like and unlike are single atomic repo calls, so two parallel requests from one user cannot both add a like.
    const likePost = async (req, res) => {
        const { status, likes } = await store.posts.like(req.params.id, req.user._id);
        if (status === 'not-found') {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (status === 'already') {
            return res.status(400).json({
                message: 'Post has already been liked.'
            });
        }
        res.status(200).json({
            message: 'Post has been liked.',
            likes,
            results: likes.length
        });
    }

    const unlikePost = async (req, res) => {
        const { status, likes } = await store.posts.unlike(req.params.id, req.user._id);
        if (status === 'not-found') {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (status === 'not-liked') {
            return res.status(400).json({
                message: 'Post has not yet been liked.'
            });
        }
        res.status(200).json({
            message: 'Post has been disliked.',
            likes,
            results: likes.length
        });
    }

    const addComment = async (req, res) => {
        const comments = await store.posts.addComment(req.params.id, req.user._id, req.body.comment);

        if (!comments) {
            return res.status(404).json({
                message: 'User or Post data not found.'
            })
        }

        res.status(201).json({
            message: 'Comment has been added.',
            comment: comments,
            results: comments.length,
        });
    }

    const deleteComment = async (req, res) => {
        if (!(await store.posts.exists(req.params.id))) {
            return res.status(404).json({ message: 'Post not found' });
        }
        const comment = await store.posts.getComment(req.params.id, req.params.comment_id);

        if (!comment) {
            return res.status(404).json({ msg: 'Comment does not exist' });
        }

        if (comment.userId !== req.user._id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const outcome = await store.posts.removeComment(req.params.id, req.params.comment_id);
        if (outcome === 'post-not-found') {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (outcome === 'comment-not-found') {
            return res.status(404).json({ msg: 'Comment does not exist' });
        }

        res.status(200).json({
            message: 'Comment has been deleted.'
        });
    }

    return {
        getAllPosts,
        getPost,
        createPost,
        deletePost,
        getAllUsersPosts,
        editPost,
        likePost,
        unlikePost,
        addComment,
        deleteComment
    };
}
