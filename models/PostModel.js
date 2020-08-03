const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    image: {
        type: String,
        default: 'default.jpg'
    },
    title: {
        type: String,
        trim: true,
        required: true,
        max: 32
    },
    tag: {
        type: String,
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
          avatar: {
              type: String
          },
          userId: {
              type: String
          },
          name: {
              type: String 
          },
          comment: {
              type: String,
              require: true
          },
          date: {
              type: Date,
              default: Date.now
          }
        }
    ],
    date: {
        type: Date,
        default: Date.now
    }
});


module.exports = Post = mongoose.model('Post', postSchema);