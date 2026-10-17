import mongoose from 'mongoose';

export const postSchema = new mongoose.Schema(
    {
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
            maxlength: 100
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
        // Only the author's id is stored. posts.js resolves the current name and avatar on read.
        comments: [
            {
                userId: {
                    type: String
                },
                comment: {
                    type: String,
                    required: true
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
    },
    { versionKey: false }
);

export const createPostModel = (instance) => instance.model('Post', postSchema);
