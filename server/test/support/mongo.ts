import { randomBytes } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { inject } from 'vitest';

// Mongo is only ever reached through mongodb-memory-server, never a real URI. A run that needs it
// either gets the shared server from global-setup (TEST_DB_DRIVER=mongo) or starts its own for
// this test file (the store contract file in a normal `test:api` run).
let own: MongoMemoryServer | undefined;

async function baseUri(): Promise<string> {
  const provided = inject('mongoUri');
  if (provided) return provided;
  own ??= await MongoMemoryServer.create();
  return own.getUri();
}

// A URI for a database no other test uses.
export async function freshMongoUri(): Promise<string> {
  const url = new URL(await baseUri());
  url.pathname = `/t_${randomBytes(6).toString('hex')}`;
  return url.toString();
}

export async function stopOwnMongo(): Promise<void> {
  await own?.stop();
  own = undefined;
}
