import mongoose from 'mongoose';
import type { Mongoose } from 'mongoose';
import type { Store, StoreConfig } from '../types.js';
import { createAdmin } from './admin.js';
import { createPostModel } from './post-model.js';
import type { PostModel } from './post-model.js';
import { createPostRepo } from './posts.js';
import { createUserModel } from './user-model.js';
import type { UserModel } from './user-model.js';
import { createUserRepo } from './users.js';

/** The Mongo adapter also exposes its models and Mongoose instance, for the tests and the scripts. */
export interface MongoStore extends Store {
  _models: { User: UserModel; Post: PostModel };
  _instance: Mongoose;
}

/**
 * The MongoDB adapter. Each store owns a Mongoose instance, so several stores (for example one
 * per test file) can live in one process, each on its own connection.
 */
export function createMongoStore(config: Pick<StoreConfig, 'MONGO_URI'>): MongoStore {
  const instance = new mongoose.Mongoose();
  // Explicit because the default changed between majors: filter on schema paths only.
  instance.set('strictQuery', true);
  // Any query operator inside a filter is wrapped in $eq unless the code marks it trusted.
  instance.set('sanitizeFilter', true);
  const models = { User: createUserModel(instance), Post: createPostModel(instance) };
  let connected = false;

  return {
    users: createUserRepo(models),
    posts: createPostRepo(models),
    admin: createAdmin(models),
    async init() {
      if (!config.MONGO_URI) throw new Error('MONGO_URI is not set');
      await instance.connect(config.MONGO_URI);
      connected = true;
      // Waits for the unique email index so the first duplicate signup is already rejected, then
      // drops indexes an older schema left behind.
      await Promise.all([models.User.init(), models.Post.init()]);
      await Promise.all([models.User.syncIndexes(), models.Post.syncIndexes()]);
    },
    async close() {
      if (!connected) return;
      connected = false;
      await instance.disconnect();
    },
    // Exposed for the contract tests (index assertions) and the scripts.
    _models: models,
    _instance: instance,
  };
}
