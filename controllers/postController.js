const Post = require('../models/PostModel');
const User = require('../models/UserModel');

const mongoose = require('mongoose');
const { makeUpload, removeStoredFile } = require('../lib/upload');

exports.uploadPostPhoto = makeUpload({ subdir: 'posts', prefix: 'post', field: 'image' });

exports.getAllPosts = async (req, res) => { 
    try {
        const posts = await Post.find().populate('user', ['name', 'email', 'avatar', '_id']).sort({ 'date': '-1' });
        
        if (!posts) {
            return res.status(404).json({
                message: "No posts available"
            }); 
        }

        res.status(200).json({
            results: posts.length,
            posts
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: err.message
        });
    }
}

exports.getPost = async (req, res) => { 
    try {
        const post = await Post.findById(req.params.id).populate('user', ['name', 'email', 'avatar', '_id', 'socials']);
        if (!post) {
          return res.status(404).json({ 
            message: 'Post not found' 
          });
        }
    
        res.status(200).json({
            post
        });
      } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
          return res.status(404).json({ message: 'Post not found' })
        }
        res.status(500).json({
            message: err.message
        });
      }
}

exports.createPost = async (req, res) => { 
    const { title, tag, description } = req.body;
    const postFields = {};

    if (title) postFields.title = title;
    if (tag) postFields.tag = tag;
    if (description) postFields.description = description;
    if (req.user._id) postFields.user = req.user._id;
    if (req.file) postFields.image = req.file.filename;

    try {
        const post = await Post.create(postFields);
        
        res.status(201).json({
            message: `Post "${title}", has been created`,
            post
        });   
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: err.message
        });
    }
}

exports.deletePost = async (req, res) => { 
    try {
        const post = await Post.findById(req.params.id); 

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' })
        }
        // Check user
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'This post does not belong to you.' });
        }
        await post.deleteOne();
        await removeStoredFile('posts', post.image);
        res.status(200).json({ message: 'Post has been deleted.' });

    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Post not found' })
        }

        return res.status(500).json({
            message: err.message
        });
    }
}

exports.getAllUsersPosts = async (req, res) => { 
    try {
        const usersPosts = await Post.find({'user': req.params.id}).populate('user', ['name', 'email', 'avatar','_id']);
        res.status(200).json({
            message: 'success',
            results: usersPosts.length,
            posts: usersPosts
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: err.message
        });
    }
}

exports.editPost = async (req, res) => {
    // The post id comes from the URL only; an id in the body is ignored.
    const { title, tag, description } = req.body;
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ message: 'No post found with that ID' });
    }
    const postFields = {};
    if (title) postFields.title = title;
    if (tag) postFields.tag = tag;
    if (description) postFields.description = description;
    if (req.file) postFields.image = req.file.filename;
    try {
        const existing = await Post.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({
                message: 'No post found with that ID'
            });
        }
        if (existing.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'This post does not belong to you.' });
        }
        const post = await Post.findOneAndUpdate(
            { _id: req.params.id },
            { $set: postFields },
            { new: true, runValidators: true }
          );
        // The replaced image is no longer referenced, so drop it from disk
        if (req.file) await removeStoredFile('posts', existing.image);
        res.status(200).json({
            message: 'Post has been updated',
            post
        });  
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: err.message
        });
    }
}

// Like and unlike are single atomic updates: the filter makes "already liked" a no-op match, so two
// parallel requests cannot both push (likes subdocuments have their own _id, so $addToSet cannot dedupe).
exports.likePost = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ message: 'Post not found' });
    }
    const post = await Post.findOneAndUpdate(
        { _id: req.params.id, 'likes.user': { $ne: req.user.id } },
        { $push: { likes: { $each: [{ user: req.user.id }], $position: 0 } } },
        { new: true }
    );
    if (!post) {
        if (!(await Post.exists({ _id: req.params.id }))) {
            return res.status(404).json({ message: 'Post not found' });
        }
        return res.status(400).json({
            message: 'Post has already been liked.'
        });
    }
    res.status(200).json({
        message: 'Post has been liked.',
        likes: post.likes,
        results: post.likes.length
    });
}

exports.unlikePost = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ message: 'Post not found' });
    }
    const post = await Post.findOneAndUpdate(
        { _id: req.params.id, 'likes.user': req.user.id },
        { $pull: { likes: { user: req.user.id } } },
        { new: true }
    );
    if (!post) {
        if (!(await Post.exists({ _id: req.params.id }))) {
            return res.status(404).json({ message: 'Post not found' });
        }
        return res.status(400).json({
            message: 'Post has not yet been liked.'
        });
    }
    res.status(200).json({
        message: 'Post has been disliked.',
        likes: post.likes,
        results: post.likes.length
    });
}
exports.addComment = async (req, res) => { 
    try {
        const post = await Post.findById(req.params.id); 
        const user = await User.findById(req.user.id);

        if (!user || !post) {
            return res.status(404).json({
                message: 'User or Post data not found.'
            })
        }

        const newComment = {
          comment: req.body.comment,
          name: user.name,
          userId: req.user.id,
          avatar: user.avatar
        };

        post.comments.unshift(newComment);
        await post.save();
    
        res.status(201).json({
            message: 'Comment has been added.',
            comment: post.comments,
            results: post.comments.length,
        });
    
      } catch (err) {
        console.error(err);
        res.status(500).json({
            message: err.message
        });
      }
}

exports.deleteComment = async (req, res) => { 
    try {
        const post = await Post.findById(req.params.id); 
        if (!post) {
          return res.status(404).json({ message: 'Post not found' });
        }
        const comment = post.comments.find(comment => comment._id.toString() === req.params.comment_id);

        if (!comment) {
          return res.status(404).json({ msg: 'Comment does not exist' });
        }

        if (comment.userId.toString() !== req.user.id) {
          return res.status(401).json({ msg: 'User not authorized' });
        }

        const removeIndex = post.comments.map(comment => comment._id.toString()).indexOf(req.params.comment_id);
    
        post.comments.splice(removeIndex, 1);
        await post.save();
    
        res.status(200).json({
            message: 'Comment has been deleted.'
        });
    
      } catch (err) {
        console.error(err);
        res.status(500).json({
            message: err.message
        });
      }
}