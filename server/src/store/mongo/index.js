import mongoose from 'mongoose';
import { createAdmin } from './admin.js';
import { createPostModel } from './post-model.js';
import { createPostRepo } from './posts.js';
import { createUserModel } from './user-model.js';
import { createUserRepo } from './users.js';

/**
 * The MongoDB adapter. Each store owns a Mongoose instance, so several stores (for example one
 * per test file) can live in one process, each on its own connection.
 * @param {{MONGO_URI: string}} config
 * @returns {import('../types.js').Store}
 */
export function createMongoStore(config) {
  const instance = new mongoose.Mongoose();
  const models = { User: createUserModel(instance), Post: createPostModel(instance) };
  let connected = false;

  return {
    users: createUserRepo(models),
    posts: createPostRepo(models),
    admin: createAdmin(models),
    async init() {
      if (!config.MONGO_URI) throw new Error('MONGO_URI is not set');
      // Legacy options the 5.x driver still needs; removed with the mongoose 6 upgrade.
      await instance.connect(config.MONGO_URI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
      });
      connected = true;
      // Waits for the unique email index so the first duplicate signup is already rejected.
      await Promise.all([models.User.init(), models.Post.init()]);
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
