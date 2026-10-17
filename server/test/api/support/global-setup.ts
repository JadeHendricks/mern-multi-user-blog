import { MongoMemoryServer } from 'mongodb-memory-server';
import type { TestProject } from 'vitest/node';

// What `project.provide` hands to the workers; `inject('mongoUri')` in test/support/mongo.ts reads it.
declare module 'vitest' {
  export interface ProvidedContext {
    mongoUri?: string;
  }
}

// The JSON store (the default) needs no server. An in-memory MongoDB is started only for
// TEST_DB_DRIVER=mongo; each test file then uses its own database name on it.
// If the driver cannot talk to the newest binary, pin one here (see test/README.md):
//   process.env.MONGOMS_VERSION ??= '6.0.14';
export default async function setup(
  project: TestProject,
): Promise<(() => Promise<void>) | undefined> {
  if (process.env.TEST_DB_DRIVER !== 'mongo') return undefined;
  const server = await MongoMemoryServer.create();
  project.provide('mongoUri', server.getUri());
  return async () => {
    await server.stop();
  };
}
