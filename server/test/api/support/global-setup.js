import { MongoMemoryServer } from 'mongodb-memory-server';

// The JSON store (the default) needs no server. An in-memory MongoDB is started only for
// TEST_DB_DRIVER=mongo; each test file then uses its own database name on it.
// If the driver cannot talk to the newest binary, pin one here (see test/README.md):
//   process.env.MONGOMS_VERSION ??= '6.0.14';
export default async function setup(project) {
  if (process.env.TEST_DB_DRIVER !== 'mongo') return undefined;
  const server = await MongoMemoryServer.create();
  project.provide('mongoUri', server.getUri());
  return async () => {
    await server.stop();
  };
}
