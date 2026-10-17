import { runAdminContract } from './contract/admin.contract.js';
import { runPostContract } from './contract/posts.contract.js';
import { runUserContract } from './contract/users.contract.js';
import { makeJsonStore } from './support.js';

// The same suites run against the Mongo adapter in mongo.test.ts (added with that adapter).
runUserContract('json', () => makeJsonStore());
runPostContract('json', () => makeJsonStore());
runAdminContract('json', () => makeJsonStore());
