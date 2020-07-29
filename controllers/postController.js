const Post = require('../models/PostModel');
const User = require('../models/UserModel');

const multer = require('multer');

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'client/src/assets/images/posts')
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split('/')[1];
        cb(null, `post-${req.user.id}-${Date.now()}.${ext}`)
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

exports.uploadPostPhoto = upload.single('image');

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
        res.status(404).json({
            message: err
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
    const postFields = {};

    if (title) postFields.title = title;
    if (tag) postFields.tag = tag;
    if (description) postFields.description = description;
    if (req.user._id) postFields.user = req.user._id;
    if (req.file) postFields.image = req.file.filename;

    try {
        const post = await Post.create(postFields);
        console.log(post);
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
        const usersPosts = await Post.find({'user': req.params.id}).populate('user', ['name', 'email', 'avatar','_id']);
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

exports.likePost = async (req, res) => { 
    try {
        const post = await Post.findById(req.params.id);

        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
          return res.status(400).json({ 
              message: 'Post already liked' 
          });
        }

        post.likes.unshift({ user: req.user.id });
        await post.save();

        res.status(200).json({
            likes: post.likes,
            results: post.likes.length
        });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
          return res.status(404).json({ msg: 'Post not found' })
        }
        res.status(500).send('Server Error');
    }
}

exports.unlikePost = async (req, res) => { 
    try {
        const post = await Post.findById(req.params.id);
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ 
                message: 'Post has not yet been liked' 
            });
        }
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
        post.likes.splice(removeIndex, 1);
        await post.save();
        res.status(200).json(post.likes);

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
          return res.status(404).json({ msg: 'Post not found' })
        }
        res.status(500).send('Server Error');
    }
}

exports.addComment = async (req, res) => { 
    try {
        const post = await Post.findById(req.params.id); 
        const user = await User.findById(req.user.id);
    
        const newComment = {
          comment: req.body.comment,
          name: user.name,
          userId: req.user.id,
          avatar: user.avatar
        };

        post.comments.unshift(newComment);
        await post.save();
    
        res.status(201).json({
            comments: post.comments,
            results: post.comments.length,
        });
    
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
}

exports.deleteComment = async (req, res) => { 
    try {
        const post = await Post.findById(req.params.id); 

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
    
        res.json(post.comments);
    
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
}