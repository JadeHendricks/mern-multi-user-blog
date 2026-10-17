import { MongoMemoryServer } from 'mongodb-memory-server';

// One in-memory MongoDB for the whole run. Each test file uses its own database name on it.
// If mongoose 5.9 cannot talk to the newest binary, pin one here (see test/README.md):
//   process.env.MONGOMS_VERSION ??= '6.0.14';
export default async function setup(project) {
  const server = await MongoMemoryServer.create();
  project.provide('mongoUri', server.getUri());

  return async () => {
    await server.stop();
  };
}
