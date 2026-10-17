import mongoose from 'mongoose';
import type { InferSchemaType, Mongoose, Types } from 'mongoose';
import type { UserSchema } from './user-model.js';

export const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
    },
    image: {
      type: String,
      default: 'default.jpg',
    },
    title: {
      type: String,
      trim: true,
      required: true,
      maxlength: 100,
    },
    tag: {
      type: String,
      default: 'general',
    },
    description: {
      type: String,
      required: true,
    },
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'user',
        },
      },
    ],
    // Only a reference to the author is stored; the current name and avatar are populated on read.
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'user',
          required: true,
        },
        comment: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false },
);

// A user's posts newest first, and the home feed newest first.
postSchema.index({ user: 1, date: -1 });
postSchema.index({ date: -1 });

export type PostSchema = InferSchemaType<typeof postSchema>;

/** An author as populated onto a post or a comment. */
export type LeanAuthor = Pick<UserSchema, 'name' | 'avatar' | 'socials'> & { _id: Types.ObjectId };

/** A post as a lean query returns it. Authors are an id, or populated (see POPULATE in posts.ts). */
export interface LeanPost {
  _id: Types.ObjectId;
  user?: Types.ObjectId | LeanAuthor | null | undefined;
  image: string;
  title: string;
  tag: string;
  description: string;
  // Lean documents get no schema defaults, so a post written before these arrays existed has none.
  likes?: { _id: Types.ObjectId; user?: Types.ObjectId | null | undefined }[] | undefined;
  comments?:
    | {
        _id: Types.ObjectId;
        user: Types.ObjectId | LeanAuthor;
        comment: string;
        date: Date;
      }[]
    | undefined;
  date: Date;
}

export const createPostModel = (instance: Mongoose) => instance.model('Post', postSchema);
export type PostModel = ReturnType<typeof createPostModel>;
