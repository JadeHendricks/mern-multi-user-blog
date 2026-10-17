// Deterministic seed data for the E2E run and for a local, throwaway database.
//
//   SEED_MONGO_URI=mongodb://127.0.0.1:27017/blog-seed node scripts/seed.js [--reset]
//
// The CLI refuses any host except localhost / 127.0.0.1, so it can never touch a real cluster.
// Ids and dates are fixed on purpose: screenshots must look the same on every run.
// One throwaway password for every seeded account. It only exists in seeded local data.
const E2E_PASSWORD = 'E2e-Throwaway-1!';
// Raw activation token for the pending user Erin. Only its SHA-256 hash is stored, like a real signup.
const SEED_ACTIVATION_TOKEN = 'e2e00000000000000000000000000000000000000000000000000000000000a1';
const PENDING_USER = { name: 'Erin Example', email: 'erin@example.test' };

const SEED_IDS = {
  users: {
    alice: '64b000000000000000000001', // owner in the E2E specs
    bob: '64b000000000000000000002', // visitor in the E2E specs
    carol: '64b000000000000000000003',
    dan: '64b000000000000000000004',
  },
  posts: [
    '64c000000000000000000001',
    '64c000000000000000000002',
    '64c000000000000000000003',
    '64c000000000000000000004',
    '64c000000000000000000005',
    '64c000000000000000000006',
  ],
};

const SEED_USERS = [
  { key: 'alice', name: 'Alice Archer', email: 'alice@example.test' },
  { key: 'bob', name: 'Bob Baker', email: 'bob@example.test' },
  { key: 'carol', name: 'Carol Chen', email: 'carol@example.test' },
  {
    key: 'dan',
    name: 'Dan Diaz',
    email: 'dan@example.test',
    socials: {
      facebook: 'https://facebook.com/dan.diaz.example',
      linkedin: 'https://linkedin.com/in/dan-diaz-example',
      twitter: 'https://twitter.com/dandiaz_example',
    },
  },
];

const u = SEED_IDS.users;
const SEED_POSTS = [
  {
    author: u.alice,
    title: 'Three days in Lisbon',
    tag: 'travel',
    date: '2025-12-01T09:00:00.000Z',
    description:
      'Tiles, trams and custard tarts. A short guide to getting around the hills without getting lost.',
    likes: [u.bob, u.carol, u.dan],
    comments: [
      {
        by: u.bob,
        text: 'Great tips, the tram route saved me hours.',
        date: '2025-12-02T10:30:00.000Z',
      },
      { by: u.carol, text: 'Adding Lisbon to my list.', date: '2025-12-03T08:15:00.000Z' },
    ],
  },
  {
    author: u.bob,
    title: 'Why my cat judges my code',
    tag: 'funny',
    date: '2025-12-05T12:00:00.000Z',
    description:
      'Every pull request gets a long stare from the windowsill. Here is what I learned from a very opinionated reviewer.',
    likes: [u.alice, u.dan],
    comments: [
      { by: u.alice, text: 'Ours only reviews the CSS.', date: '2025-12-06T09:00:00.000Z' },
    ],
  },
  {
    author: u.carol,
    title: 'A small guide to sourdough',
    tag: 'general',
    date: '2025-12-10T07:30:00.000Z',
    description:
      'Flour, water, salt and patience. This is the schedule that finally gave me a decent crumb.',
    likes: [u.alice],
    comments: [],
  },
  {
    author: u.alice,
    title: 'Notes from a week offline',
    tag: 'general',
    date: '2025-12-18T18:45:00.000Z',
    description:
      'No phone, no laptop, one paperback. What changed, what did not, and what I kept afterwards.',
    likes: [u.bob, u.carol],
    comments: [
      {
        by: u.dan,
        text: 'I tried this last summer. Hard but worth it.',
        date: '2025-12-19T11:00:00.000Z',
      },
    ],
  },
  {
    author: u.dan,
    title: 'Hiking the coastal path',
    tag: 'travel',
    date: '2026-01-03T15:20:00.000Z',
    description:
      'Forty kilometres of cliffs and gulls. Packing list, rough timings and the one pub worth the detour.',
    likes: [u.alice, u.bob, u.carol],
    comments: [],
  },
  {
    author: u.bob,
    title: 'The unreasonable joy of a good keyboard',
    tag: 'funny',
    date: '2026-01-09T20:10:00.000Z',
    description:
      'Clicky switches, a heavy case and a neighbour who has stopped speaking to me. Worth it.',
    likes: [],
    comments: [
      {
        by: u.carol,
        text: 'Please tell me it is not the loud one.',
        date: '2026-01-10T07:45:00.000Z',
      },
    ],
  },
];

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
async function seed(mongoose) {
  // The models are CommonJS and register themselves on the shared mongoose instance.
  const User = require('../models/UserModel');
  const Post = require('../models/PostModel');
  const { hashToken } = require('../lib/tokens');
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

  const mongoose = require('mongoose');
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });
  try {
    const User = require('../models/UserModel');
    const Post = require('../models/PostModel');
    if (process.argv.includes('--reset')) {
      await Promise.all([User.deleteMany({}), Post.deleteMany({})]);
    } else if ((await User.countDocuments()) > 0 || (await Post.countDocuments()) > 0) {
      console.error(
        'The database already has users or posts. Re-run with --reset to replace them.',
      );
      process.exitCode = 1;
      return;
    }
    const counts = await seed(mongoose);
    console.log(`Seeded ${counts.users} users, ${counts.pending} pending user and ${counts.posts} posts.`);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}

module.exports = { seed, isLocalMongoUri, E2E_PASSWORD, SEED_ACTIVATION_TOKEN, SEED_IDS, SEED_USERS, SEED_POSTS };
