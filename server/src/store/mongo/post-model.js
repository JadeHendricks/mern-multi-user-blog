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
        // Only a reference to the author is stored; the current name and avatar are populated on read.
        comments: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'user',
                    required: true
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

// A user's posts newest first, and the home feed newest first.
postSchema.index({ user: 1, date: -1 });
postSchema.index({ date: -1 });

export const createPostModel = (instance) => instance.model('Post', postSchema);
