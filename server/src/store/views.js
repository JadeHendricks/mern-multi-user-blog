// Turns stored records into the API-ready views described in ../types.js. Records on disk use ISO
// strings for dates; views use Date objects. Everything returned here is a fresh object, so a
// caller can never change the committed state by accident.

export const DEFAULT_AVATAR = 'default.jpg';
export const DELETED_USER_NAME = 'Deleted user';

const toDate = (value) => (value === undefined || value === null ? undefined : new Date(value));

// Secrets and bookkeeping a normal read must not return.
const SECRET_DATES = ['passwordChangedAt', 'activationExpires', 'resetExpires'];
const SECRET_STRINGS = ['passwordHash', 'activationHash', 'resetHash'];

export function toUser(record, { secrets = false } = {}) {
  const user = {
    _id: record._id,
    avatar: record.avatar,
    name: record.name,
    email: record.email,
    role: record.role,
    status: record.status,
    createdAt: toDate(record.createdAt),
    updatedAt: toDate(record.updatedAt),
  };
  if (record.socials) user.socials = { ...record.socials };
  if (secrets) {
    for (const key of SECRET_STRINGS) if (record[key] !== undefined) user[key] = record[key];
    for (const key of SECRET_DATES) if (record[key] !== undefined) user[key] = toDate(record[key]);
  }
  return user;
}

export function toPublicUser(record) {
  const user = {
    _id: record._id,
    name: record.name,
    avatar: record.avatar,
    createdAt: toDate(record.createdAt),
  };
  if (record.socials) user.socials = { ...record.socials };
  return user;
}

// The stored user including secrets, with Date objects, under the names the repo uses.
export function toRawUser(record) {
  const raw = { ...record, socials: record.socials ? { ...record.socials } : undefined };
  if (raw.socials === undefined) delete raw.socials;
  raw.createdAt = toDate(record.createdAt);
  raw.updatedAt = toDate(record.updatedAt);
  for (const key of SECRET_DATES) if (record[key] !== undefined) raw[key] = toDate(record[key]);
  return raw;
}

// Lookup tables over the committed state, rebuilt only when the state object is replaced.
const indexCache = new WeakMap();

export function userIndex(state) {
  let index = indexCache.get(state);
  if (!index) {
    index = { byId: new Map(), byEmail: new Map() };
    for (const record of state.users) {
      index.byId.set(record._id, record);
      index.byEmail.set(record.email, record);
    }
    indexCache.set(state, index);
  }
  return index;
}

function toCommentView(comment, byId) {
  const author = byId.get(comment.user);
  return {
    _id: comment._id,
    comment: comment.comment,
    date: toDate(comment.date),
    userId: comment.user,
    name: author ? author.name : DELETED_USER_NAME,
    avatar: author ? author.avatar : DEFAULT_AVATAR,
  };
}

const toLikeView = (like) => ({ _id: like._id, user: like.user });

// mode 'id': the author stays an id (what create and edit have always returned).
// mode 'list': author populated with _id, name, avatar.
// mode 'detail': the same plus socials when set.
export function toPostView(record, byId, mode = 'list') {
  // A post imported without an author has no `user`; say null (as find and list do), not a missing key.
  let user = record.user ?? null;
  if (mode !== 'id') {
    const author = byId.get(record.user);
    if (!author) {
      user = null;
    } else {
      user = { _id: author._id, name: author.name, avatar: author.avatar };
      if (mode === 'detail' && author.socials) user.socials = { ...author.socials };
    }
  }
  return {
    _id: record._id,
    user,
    image: record.image,
    title: record.title,
    tag: record.tag,
    description: record.description,
    likes: record.likes.map(toLikeView),
    comments: record.comments.map((comment) => toCommentView(comment, byId)),
    date: toDate(record.date),
  };
}

export { toCommentView, toLikeView };
