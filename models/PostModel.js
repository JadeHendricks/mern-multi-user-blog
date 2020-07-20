const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: true,
        unique: true,
        max: 32
    },
    tag: {
        type: String,
        trim: true,
        required: true,
        default: 'general'
    },
    description: {
        type: String,
        required: true,
    }
}, { timestamps: true });


module.exports = Post = mongoose.model('Post', postSchema);