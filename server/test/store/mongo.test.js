import { afterAll, describe, expect, it } from 'vitest';
import { stopOwnMongo } from '../support/mongo.js';
import { runAdminContract } from './contract/admin.contract.js';
import { runPostContract } from './contract/posts.contract.js';
import { runUserContract } from './contract/users.contract.js';
import { makeMongoStore } from './support.js';

// The same suites json.test.js runs, against the Mongo adapter on an in-memory MongoDB.
afterAll(stopOwnMongo);

runUserContract('mongo', () => makeMongoStore());
runPostContract('mongo', () => makeMongoStore());
runAdminContract('mongo', () => makeMongoStore());

// Mongo-only: the indexes the schema declares (the JSON adapter keeps its email index in memory,
// which the shared contract already covers with its duplicate-email cases).
describe('mongo: indexes', () => {
  it('has the unique email index and the two post indexes, and no others', async () => {
    const { store, cleanup } = await makeMongoStore();
    try {
      const indexes = await store.admin.indexes();

      expect(indexes.users).toEqual([{ key: { email: 1 }, unique: true }]);
      expect(indexes.posts).toEqual(
        expect.arrayContaining([
          { key: { user: 1, date: -1 }, unique: false },
          { key: { date: -1 }, unique: false },
        ]),
      );
      expect(indexes.posts).toHaveLength(2);
    } finally {
      await cleanup();
    }
  });
});
