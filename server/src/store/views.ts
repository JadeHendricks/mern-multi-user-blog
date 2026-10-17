// Turns stored records into the API-ready views described in ./types.ts. Records on disk use ISO
// strings for dates; views use Date objects. Everything returned here is a fresh object, so a
// caller can never change the committed state by accident.
import { DEFAULT_AVATAR } from '@mern-blog/shared';
import type { CommentRecord, DateValue, LikeRecord, PostRecord, UserRecord } from './records.js';
import type {
  CommentView,
  LikeView,
  PostView,
  PublicUser,
  RawUser,
  SecretsOption,
  User,
} from './types.js';

export const DELETED_USER_NAME = 'Deleted user';

function toDate(value: DateValue): Date;
function toDate(value: DateValue | null | undefined): Date | undefined;
function toDate(value: DateValue | null | undefined): Date | undefined {
  return value === undefined || value === null ? undefined : new Date(value);
}

// Secrets and bookkeeping a normal read must not return.
const SECRET_DATES = ['passwordChangedAt', 'activationExpires', 'resetExpires'] as const;
const SECRET_STRINGS = ['passwordHash', 'activationHash', 'resetHash'] as const;

export function toUser(record: UserRecord, { secrets = false }: SecretsOption = {}): User {
  const user: User = {
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
    for (const key of SECRET_STRINGS) {
      const value = record[key];
      if (value !== undefined) user[key] = value;
    }
    for (const key of SECRET_DATES) {
      const value = record[key];
      if (value !== undefined) user[key] = toDate(value);
    }
  }
  return user;
}

export function toPublicUser(record: UserRecord): PublicUser {
  const user: PublicUser = {
    _id: record._id,
    name: record.name,
    avatar: record.avatar,
    createdAt: toDate(record.createdAt),
  };
  if (record.socials) user.socials = { ...record.socials };
  return user;
}

// The stored user including secrets, with Date objects, under the names the repo uses.
export function toRawUser(record: UserRecord): RawUser {
  const {
    socials,
    createdAt,
    updatedAt,
    passwordChangedAt,
    activationExpires,
    resetExpires,
    ...rest
  } = record;
  const raw: RawUser = { ...rest, createdAt: toDate(createdAt), updatedAt: toDate(updatedAt) };
  if (socials) raw.socials = { ...socials };
  if (passwordChangedAt !== undefined) raw.passwordChangedAt = toDate(passwordChangedAt);
  if (activationExpires !== undefined) raw.activationExpires = toDate(activationExpires);
  if (resetExpires !== undefined) raw.resetExpires = toDate(resetExpires);
  return raw;
}

interface UserIndex {
  byId: Map<string, UserRecord<string>>;
  byEmail: Map<string, UserRecord<string>>;
}

// Lookup tables over the committed state, rebuilt only when the state object is replaced.
const indexCache = new WeakMap<object, UserIndex>();

export function userIndex(state: { users: readonly UserRecord<string>[] }): UserIndex {
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

/** What a comment needs from its author. */
type CommentAuthor = Pick<UserRecord, 'name' | 'avatar'>;
/** What a post needs from its author. */
export type PostAuthor = Pick<UserRecord, '_id' | 'name' | 'avatar' | 'socials'>;

function toCommentView(
  comment: CommentRecord,
  byId: ReadonlyMap<string, CommentAuthor>,
): CommentView {
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

const toLikeView = (like: LikeRecord): LikeView => ({ _id: like._id, user: like.user });

export type PostViewMode = 'id' | 'list' | 'detail';

// mode 'id': the author stays an id (what create and edit have always returned).
// mode 'list': author populated with _id, name, avatar.
// mode 'detail': the same plus socials when set.
export function toPostView(
  record: PostRecord,
  byId: ReadonlyMap<string, PostAuthor>,
  mode: PostViewMode = 'list',
): PostView {
  // A post imported without an author has no `user`; say null (as find and list do), not a missing key.
  let user: PostView['user'] = record.user ?? null;
  if (mode !== 'id') {
    const author = record.user === undefined ? undefined : byId.get(record.user);
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
