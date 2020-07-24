const Post = require('../models/PostModel');

exports.getAllPosts = async (req, res) => { 
    try {
        const posts = await Post.find().populate('user', ['name', 'email', '_id']);;
        
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
        res.status(404).json({
            message: err
        }); 
    }
}

exports.getPost = async (req, res) => { 
    try {
        const post = await Post.findById(req.params.id).populate('user', ['name', 'email', '_id']);
        if (!post) {
          return res.status(404).json({ 
            message: 'Post not found' 
          });
        }
    
        res.status(200).json({
            post
        });
      } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
          return res.status(404).json({ message: 'Post not found' })
        }
        res.status(500).json({
            message: err
        });
      }
}

exports.createPost = async (req, res) => { 
    const { title, tag, description } = req.body;
    try {
        const post = await Post.create({ title, tag, description, user: req.user._id });
        res.status(201).json({
            message: `Post "${title}", has been created`,
            post
        });   
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            message: err
        });
    }
}

exports.deletePost = async (req, res) => { 
    try {
        const post = await Post.findById(req.params.id); 

        if (!post) {
            return res.status(404).json({ message: 'Post not found' })
        }
        // Check user
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'This post does not belong to you' });
        }
        await post.remove();
        res.json({ message: 'Post removed' });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Post not found' })
        }
        res.status(500).json({
            message: err
        });
    }
}

exports.getAllUsersPosts = async (req, res) => { 
    try {
        const usersPosts = await Post.find({'user': req.params.id}).populate('user', ['name', 'email', '_id']);
        res.status(200).json({
            message: 'success',
            results: usersPosts.length,
            posts: usersPosts
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            message: err
        });
    }
}

exports.editPost = async (req, res) => {

    const { title, tag, description } = req.body;

    const postFields = {};

    if (title) postFields.title = title;
    if (tag) postFields.tag = tag;
    if (description) postFields.description = description;


    try {
        const post = await Post.findOneAndUpdate(
            { user: req.user.id },
            { $set: postFields },
            { new: true, upsert: true }
          );

        if (!post) {
            res.status(404).json({
                message: 'No post found with that ID'
            });
        }
    
        res.status(200).json({
            message: 'Post has been updated',
            post
        });  
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            message: err
        }); 
    }
}