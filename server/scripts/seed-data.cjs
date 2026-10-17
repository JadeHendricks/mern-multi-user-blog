// Pure seed data, kept as CommonJS on purpose: Playwright loads the CommonJS e2e/ files and
// cannot require() an ES module, while the ESM seed script can import this file.
// Ids and dates are fixed on purpose: screenshots must look the same on every run.
// One throwaway password for every seeded account. It only exists in seeded local data.
const E2E_PASSWORD = 'E2e-Throwaway-1!';
// Raw activation token for the pending user Erin. Only its SHA-256 hash is stored, like a real signup.
const SEED_ACTIVATION_TOKEN = 'e2e00000000000000000000000000000000000000000000000000000000000a1';
// A fixed id too, so a seeded store is the same every time.
const PENDING_USER = { _id: '64b000000000000000000005', name: 'Erin Example', email: 'erin@example.test' };

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

module.exports = { E2E_PASSWORD, SEED_ACTIVATION_TOKEN, PENDING_USER, SEED_IDS, SEED_USERS, SEED_POSTS };
