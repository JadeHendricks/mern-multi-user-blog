import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { inject } from 'vitest';

// Native require so the test shares one mongoose instance (and module cache) with the app.
const require = createRequire(import.meta.url);
const mongoose = require('mongoose');

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
  await require('../../../src/models/UserModel.js').init();
  await require('../../../src/models/PostModel.js').init();
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
