import mongoose from 'mongoose';
import { hashToken } from '../src/lib/tokens.js';
import { Post } from '../src/models/PostModel.js';
import { User } from '../src/models/UserModel.js';
import seedData from './seed-data.cjs';
// Deterministic seed data for the E2E run and for a local, throwaway database.
//
//   SEED_MONGO_URI=mongodb://127.0.0.1:27017/blog-seed node scripts/seed.js [--reset]
//
// The CLI refuses any host except localhost / 127.0.0.1, so it can never touch a real cluster.
// Ids and dates are fixed on purpose: screenshots must look the same on every run.
const { E2E_PASSWORD, SEED_ACTIVATION_TOKEN, PENDING_USER, SEED_IDS, SEED_USERS, SEED_POSTS } = seedData;

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

// Returns true only when every host in a mongodb:// URI is localhost or 127.0.0.1.
// mongodb+srv:// always means a DNS lookup of a remote cluster, so it is refused.
function isLocalMongoUri(uri) {
  if (typeof uri !== 'string') return false;
  const match = /^mongodb:\/\/([^/?]+)/.exec(uri.trim());
  if (!match) return false;
  const authority = match[1];
  const hostList = authority.slice(authority.lastIndexOf('@') + 1);
  return hostList.split(',').every((hostPort) => {
    const host = hostPort.replace(/:\d+$/, '').toLowerCase();
    return LOCAL_HOSTS.has(host);
  });
}

// Inserts the fixed users, posts, comments and likes. Expects empty users and posts collections.
async function seed() {
  const ObjectId = mongoose.Types.ObjectId;

  // Each save runs the bcrypt pre-save hook, so the seeded passwords are hashed like real ones.
  const users = {};
  for (const spec of SEED_USERS) {
    users[spec.key] = await User.create({
      _id: new ObjectId(SEED_IDS.users[spec.key]),
      name: spec.name,
      email: spec.email,
      password: E2E_PASSWORD,
      status: 'active',
      // Fixed so the "Joined date" on the users page does not change with the day the tests run.
      createdAt: new Date('2025-11-20T09:00:00.000Z'),
      ...(spec.socials && { socials: spec.socials }),
    });
  }
  // Pending until the activation link is used; the far-future expiry keeps screenshots stable.
  await User.create({
    ...PENDING_USER,
    password: E2E_PASSWORD,
    status: 'pending',
    createdAt: new Date('2025-11-20T09:00:00.000Z'),
    activationToken: hashToken(SEED_ACTIVATION_TOKEN),
    activationExpires: new Date('2099-01-01T00:00:00.000Z'),
  });
  const byId = Object.values(users).reduce((acc, user) => ({ ...acc, [user.id]: user }), {});

  for (const [index, spec] of SEED_POSTS.entries()) {
    await Post.create({
      _id: new ObjectId(SEED_IDS.posts[index]),
      user: new ObjectId(spec.author),
      title: spec.title,
      tag: spec.tag,
      description: spec.description,
      date: new Date(spec.date),
      likes: spec.likes.map((id) => ({ user: new ObjectId(id) })),
      comments: spec.comments.map((comment, i) => ({
        _id: new ObjectId(`64d0000000000000000${index}0${i}`.padEnd(24, '0').slice(0, 24)),
        userId: comment.by,
        name: byId[comment.by].name,
        avatar: byId[comment.by].avatar,
        comment: comment.text,
        date: new Date(comment.date),
      })),
    });
  }
  return { users: SEED_USERS.length, posts: SEED_POSTS.length, pending: 1 };
}

async function main() {
  const uri = process.env.SEED_MONGO_URI;
  if (!uri) {
    console.error(
      'Set SEED_MONGO_URI to a local MongoDB, e.g. mongodb://127.0.0.1:27017/blog-seed',
    );
    process.exitCode = 1;
    return;
  }
  if (!isLocalMongoUri(uri)) {
    // The URI is never printed: it may contain credentials.
    console.error('Refusing to seed: SEED_MONGO_URI must point at localhost or 127.0.0.1.');
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });
  try {
    if (process.argv.includes('--reset')) {
      await Promise.all([User.deleteMany({}), Post.deleteMany({})]);
    } else if ((await User.countDocuments()) > 0 || (await Post.countDocuments()) > 0) {
      console.error(
        'The database already has users or posts. Re-run with --reset to replace them.',
      );
      process.exitCode = 1;
      return;
    }
    const counts = await seed();
    console.log(`Seeded ${counts.users} users, ${counts.pending} pending user and ${counts.posts} posts.`);
  } finally {
    await mongoose.disconnect();
  }
}

if (import.meta.filename === process.argv[1]) {
  main().catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}

export { seed, isLocalMongoUri, E2E_PASSWORD, SEED_ACTIVATION_TOKEN, SEED_IDS, SEED_USERS, SEED_POSTS };
