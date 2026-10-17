import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { inject } from 'vitest';
import { Post } from '../../../src/models/PostModel.js';
import { User } from '../../../src/models/UserModel.js';


export async function connectDb() {
  const base = inject('mongoUri');
  const uri = `${base}test_${randomBytes(4).toString('hex')}`;
  // Same options as db.js
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });
  // Build the unique email index up front so duplicate checks behave like production.
  await User.init();
  await Post.init();
}

export async function clearDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function disconnectDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

export { mongoose };
