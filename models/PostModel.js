const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
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
    },
    likes: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
          }
        }
    ],
    comments: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
          },
          comment: {
              type: String,
              require: true
          }
        }
    ],
    date: {
        type: Date,
        default: Date.now
    }
});


module.exports = Post = mongoose.model('Post', postSchema);