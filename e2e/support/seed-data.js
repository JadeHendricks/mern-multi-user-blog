// Shared constants for the specs: seeded ids, user logins, routes and signed link tokens.
const path = require('node:path');
const jwt = require('jsonwebtoken');
const { SEED_IDS, SEED_USERS, E2E_PASSWORD } = require('../../scripts/seed');

const ids = {
  alice: SEED_IDS.users.alice,
  bob: SEED_IDS.users.bob,
  carol: SEED_IDS.users.carol,
  dan: SEED_IDS.users.dan,
  posts: SEED_IDS.posts,
};

const find = (key) => SEED_USERS.find((user) => user.key === key);
const owner = { name: find('alice').name, email: find('alice').email, password: E2E_PASSWORD };
const visitor = { name: find('bob').name, email: find('bob').email, password: E2E_PASSWORD };

// The pages only decode these tokens to show a first name; the API is never called with them in a
// read-only spec. They are signed with a label, not a real secret, and carry no timestamp so the
// string is identical on every run.
const sign = (payload) => jwt.sign(payload, 'e2e-not-a-secret', { noTimestamp: true });
const activateToken = sign({ name: 'Erin Example', email: 'erin@example.test' });
const resetToken = sign({ _id: ids.alice, name: owner.name });

const routes = {
  home: '/',
  post: `/post/${ids.posts[0]}`,
  profileOwner: `/profile/${ids.alice}`,
  profileVisitor: `/profile/${ids.bob}`,
  users: '/users',
  popular: '/most-popular-posts',
  login: '/login',
  register: '/register',
  forgot: '/forgot-password',
  reset: `/auth/password/reset/${resetToken}`,
  activate: `/auth/activate/${activateToken}`,
  createPost: '/create-post',
  editPost: `/edit-post/${ids.posts[0]}`,
};

const authDir = path.join(__dirname, '..', '.auth');
const storageState = {
  owner: path.join(authDir, 'owner.json'),
  visitor: path.join(authDir, 'visitor.json'),
};

module.exports = { ids, owner, visitor, routes, storageState, authDir };
