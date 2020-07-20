const Post = require('../models/PostModel');

exports.getAllPosts = async (req, res) => { 
    try {
        const posts = await Post.find();
        
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
        const post = await Post.findById(req.params.id);
        if (!post) {
          return res.status(404).json({ 
              msg: 'Post not found' 
          });
        }
    
        res.status(200).json({
            post
        });
      } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
          return res.status(404).json({ msg: 'Post not found' })
        }
        res.status(500).send('Server Error');
      }
}

exports.createPost = async (req, res) => { 
    const { title, tag, description } = req.body;
    try {
        const post = await Post.create({ title, tag, description });
        res.status(201).json({
            message: 'Post has been created',
            post
        });   
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

}

exports.deletePost = async (req, res) => { 
    try {
        const post = await Post.findById(req.params.id); 

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' })
        }
        // Check user
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'This post does not belong to you' });
        }
        await post.remove();
        res.json({ msg: 'Post removed' });

    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Post not found' })
      }
      res.status(500).send('Server Error');
    }
}

exports.editPost = async (req, res) => { }