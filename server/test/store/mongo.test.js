import { afterAll } from 'vitest';
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
