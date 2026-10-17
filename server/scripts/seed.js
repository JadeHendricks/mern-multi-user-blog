import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { hashPassword } from '../src/lib/password.js';
import { hashToken } from '../src/lib/tokens.js';
import { describeError, isLocalTarget, openStore, readArgs, REMOTE_HINT, scriptConfig } from './lib/cli.js';
import seedData from './seed-data.cjs';

// Deterministic sample data for the E2E run and for a throwaway local store.
//
//   npm run seed              fill an empty store
//   npm run seed -- --reset   wipe the store (and its uploads folder) first
//
// Ids, dates, titles and comments are fixed on purpose: screenshots must look the same on every
// run. Only the password hashes differ between runs (bcrypt salts them).
const { E2E_PASSWORD, SEED_ACTIVATION_TOKEN, PENDING_USER, SEED_IDS, SEED_USERS, SEED_POSTS } = seedData;

// Sample images (server/seed-assets) are copied into DATA_DIR/uploads and used as avatars and
// post images. Off until the uploads folder is served and the client shows it (FEAT-005 C22), so
// the seeded screens keep the default images and the screenshots do not change.
export const SEED_IMAGES = false;

const CREATED_AT = new Date('2025-11-20T09:00:00.000Z');
const ASSETS = path.resolve(import.meta.dirname, '../seed-assets');

// Which sample file each seeded user and post gets (posts cycle through the three banners).
const userImage = (key) => `seed-user-${SEED_USERS.findIndex((user) => user.key === key) + 1}.svg`;
const postImage = (index) => `seed-post-${(index % 3) + 1}.svg`;

async function copyAssets(kind, dataDir) {
  const target = path.join(dataDir, 'uploads', kind);
  await mkdir(target, { recursive: true });
  for (const name of await readdir(path.join(ASSETS, kind))) {
    await copyFile(path.join(ASSETS, kind, name), path.join(target, name));
  }
}

/**
 * Fills an empty store through its repos. The caller decides whether it is empty.
 * @param {import('../src/store/types.js').Store} store
 * @param {{dataDir?: string, images?: boolean}} [options] dataDir is needed when images are on
 */
export async function seed(store, { dataDir, images = SEED_IMAGES } = {}) {
  if (images) {
    if (!dataDir) throw new Error('seed with images needs a dataDir to copy the sample files into.');
    await copyAssets('users', dataDir);
    await copyAssets('posts', dataDir);
  }

  // One hash for every account: they all share the throwaway password.
  const passwordHash = await hashPassword(E2E_PASSWORD);
  for (const spec of SEED_USERS) {
    await store.users.create({
      _id: SEED_IDS.users[spec.key],
      name: spec.name,
      email: spec.email,
      passwordHash,
      status: 'active',
      // Fixed so the "Joined date" on the users page does not change with the day the tests run.
      createdAt: CREATED_AT,
      ...(images && { avatar: userImage(spec.key) }),
      ...(spec.socials && { socials: spec.socials }),
    });
  }
  // Pending until the activation link is used; the far-future expiry keeps screenshots stable.
  await store.users.create({
    ...PENDING_USER,
    passwordHash,
    status: 'pending',
    createdAt: CREATED_AT,
    activationHash: hashToken(SEED_ACTIVATION_TOKEN),
    activationExpires: new Date('2099-01-01T00:00:00.000Z'),
  });

  await store.posts.insertMany(
    SEED_POSTS.map((spec, index) => ({
      _id: SEED_IDS.posts[index],
      user: spec.author,
      title: spec.title,
      tag: spec.tag,
      description: spec.description,
      date: new Date(spec.date),
      ...(images && { image: postImage(index) }),
      // Fixed like and comment ids too, so every seeded store is identical.
      likes: spec.likes.map((id, i) => ({ _id: `64e0000000000000000${index}0${i}`.padEnd(24, '0').slice(0, 24), user: id })),
      comments: spec.comments.map((comment, i) => ({
        _id: `64d0000000000000000${index}0${i}`.padEnd(24, '0').slice(0, 24),
        user: comment.by,
        comment: comment.text,
        date: new Date(comment.date),
      })),
    })),
  );
  return { users: SEED_USERS.length, posts: SEED_POSTS.length, pending: 1 };
}

// Empties the uploads folder but keeps the folder itself.
async function emptyUploads(dataDir) {
  const uploads = path.join(dataDir, 'uploads');
  let names = [];
  try {
    names = await readdir(uploads);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  for (const name of names) await rm(path.join(uploads, name), { recursive: true, force: true });
}

/**
 * The CLI. Returns the exit code instead of exiting, so tests can call it.
 * @param {string[]} argv
 * @param {{env?: object, out?: (line: string) => void, err?: (line: string) => void, open?: Function}} [io]
 */
export async function run(argv, { env = process.env, out = console.log, err = console.error, open = openStore } = {}) {
  let store;
  try {
    const { values } = readArgs(argv, { reset: { type: 'boolean' }, 'allow-remote': { type: 'boolean' } });
    const config = scriptConfig(env, values.driver);
    // A reset deletes data, so a Mongo server that is not on this machine needs an explicit yes.
    if (!isLocalTarget(config) && !values['allow-remote']) {
      err('Refusing to seed: the Mongo server is not on this machine.');
      err(REMOTE_HINT);
      return 1;
    }
    store = await open(config);
    const counts = await store.admin.counts();
    if (counts.users > 0 || counts.posts > 0) {
      if (!values.reset) {
        err('The store already has users or posts. Re-run with --reset to replace them.');
        return 1;
      }
      await store.admin.reset();
      await emptyUploads(config.DATA_DIR);
    }
    const result = await seed(store, { dataDir: config.DATA_DIR });
    out(`Seeded ${result.users} users, ${result.pending} pending user and ${result.posts} posts (${config.DB_DRIVER} store).`);
    return 0;
  } catch (error) {
    err(describeError(error));
    return 1;
  } finally {
    await store?.close().catch(() => {});
  }
}

export { E2E_PASSWORD, SEED_ACTIVATION_TOKEN, PENDING_USER, SEED_IDS, SEED_USERS, SEED_POSTS };

if (import.meta.filename === process.argv[1]) {
  process.exitCode = await run(process.argv.slice(2));
}
