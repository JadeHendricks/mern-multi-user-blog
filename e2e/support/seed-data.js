// Shared constants for the specs: seeded ids, user logins, routes and link tokens.
const path = require('node:path');
const { SEED_IDS, SEED_USERS, E2E_PASSWORD, SEED_ACTIVATION_TOKEN } = require('../../server/scripts/seed-data.cjs');

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

// Activation uses the seeded pending user's raw token. The reset page makes no API call on load,
// so a fixed junk string is enough for its screenshot.
const activateToken = SEED_ACTIVATION_TOKEN;
const resetToken = 'e2e-fixed-reset-token';
const routes = {
  home: '/',
  post: `/post/${ids.posts[0]}`,
  profileOwner: `/profile/${ids.alice}`,
  profileVisitor: `/profile/${ids.bob}`,
  profileDan: `/profile/${ids.dan}`,
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
