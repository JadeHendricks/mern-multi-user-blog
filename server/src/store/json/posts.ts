import { DEFAULT_AVATAR } from '@mern-blog/shared';
import { isValidId, newId } from '../../lib/ids.js';
import { paginate } from '../../lib/pagination.js';
import { StoreValidationError } from '../errors.js';
import { cleanComment, cleanDescription, cleanTitle, orDefault } from '../rules.js';
import type { LikeResult, PostInput, PostRepo, UnlikeResult } from '../types.js';
import { toCommentView, toLikeView, toPostView, userIndex } from '../views.js';
import type { PostAuthor } from '../views.js';
import type { FileDb } from './file-db.js';
import type { JsonState, StoredPost, StoredUser } from './records.js';

const DEFAULT_TAG = 'general';
const DEFAULT_IMAGE = DEFAULT_AVATAR;

const iso = (value: Date | string): string => new Date(value).toISOString();

// Newest first, with the id as a tie-break so the order is stable.
const byDateDesc = (a: StoredPost, b: StoredPost): number =>
  a.date < b.date ? 1 : a.date > b.date ? -1 : a._id < b._id ? 1 : -1;

const usersById = (users: readonly StoredUser[]): Map<string, StoredUser> =>
  new Map(users.map((user) => [user._id, user] as const));

function buildPost(data: PostInput): StoredPost {
  if (data._id !== undefined && !isValidId(data._id))
    throw new StoreValidationError('Path `_id` is not a valid id.');
  return {
    _id: data._id ?? newId(),
    user: data.user,
    image: orDefault(data.image, DEFAULT_IMAGE),
    title: cleanTitle(data.title),
    tag: orDefault(data.tag, DEFAULT_TAG),
    description: cleanDescription(data.description),
    likes: (data.likes ?? []).map((like) => ({ _id: like._id ?? newId(), user: like.user })),
    comments: (data.comments ?? []).map((comment) => {
      // Like the Mongo adapter: a comment always names its author.
      const author = comment.user ?? comment.userId;
      if (author === undefined) throw new StoreValidationError('Path `user` is not a valid id.');
      return {
        _id: comment._id ?? newId(),
        user: author,
        comment: cleanComment(comment.comment),
        date: comment.date ? iso(comment.date) : new Date().toISOString(),
      };
    }),
    date: data.date ? iso(data.date) : new Date().toISOString(),
  };
}

export function createPostRepo(db: FileDb): PostRepo {
  const find = (state: JsonState, id: string) =>
    isValidId(id) ? state.posts.find((post) => post._id === id) : undefined;
  const authors = (): ReadonlyMap<string, PostAuthor> => userIndex(db.read()).byId;

  return {
    async findById(id) {
      const record = find(db.read(), id);
      return record ? toPostView(record, authors(), 'detail') : null;
    },

    async list({ cursor, limit } = {}) {
      const rows = [...db.read().posts].sort(byDateDesc);
      const page = paginate(rows, { cursor, limit, key: (post) => post.date, direction: 'desc' });
      const byId = authors();
      return {
        items: page.items.map((post) => toPostView(post, byId, 'list')),
        nextCursor: page.nextCursor,
      };
    },

    async listByUser(userId, { cursor, limit } = {}) {
      // Newest first, like the main list (this endpoint used to return oldest first).
      const rows = db
        .read()
        .posts.filter((post) => post.user === userId)
        .sort(byDateDesc);
      const page = paginate(rows, { cursor, limit, key: (post) => post.date, direction: 'desc' });
      const byId = authors();
      return {
        items: page.items.map((post) => toPostView(post, byId, 'list')),
        nextCursor: page.nextCursor,
      };
    },

    create: ({ user, title, tag, description, image }) =>
      db.write((draft) => {
        const record = buildPost({ user, title, tag, description, image });
        draft.posts.push(record);
        return toPostView(record, new Map<string, PostAuthor>(), 'id');
      }),

    update: (id, fields = {}) =>
      db.write((draft, tx) => {
        const record = find(draft, id);
        if (!record) {
          tx.unchanged();
          return null;
        }
        if (fields.title !== undefined) record.title = cleanTitle(fields.title);
        if (fields.description !== undefined)
          record.description = cleanDescription(fields.description);
        if (fields.tag !== undefined) record.tag = orDefault(fields.tag, DEFAULT_TAG);
        if (fields.image !== undefined) record.image = orDefault(fields.image, DEFAULT_IMAGE);
        return toPostView(record, usersById(draft.users), 'id');
      }),

    async getOwnerAndImage(id) {
      const record = find(db.read(), id);
      return record ? { user: record.user, image: record.image } : null;
    },

    delete: (id) =>
      db.write((draft, tx) => {
        const record = find(draft, id);
        if (!record) {
          tx.unchanged();
          return null;
        }
        draft.posts.splice(draft.posts.indexOf(record), 1);
        return { image: record.image };
      }),

    async exists(id) {
      return find(db.read(), id) !== undefined;
    },

    // Runs in the write queue, so two parallel calls by one user can never both add a like.
    like: (id, userId) =>
      db.write<LikeResult>((draft, tx) => {
        const record = find(draft, id);
        if (!record) {
          tx.unchanged();
          return { status: 'not-found' };
        }
        if (record.likes.some((like) => like.user === userId)) {
          tx.unchanged();
          return { status: 'already' };
        }
        record.likes.unshift({ _id: newId(), user: userId });
        return { status: 'liked', likes: record.likes.map(toLikeView) };
      }),

    unlike: (id, userId) =>
      db.write<UnlikeResult>((draft, tx) => {
        const record = find(draft, id);
        if (!record) {
          tx.unchanged();
          return { status: 'not-found' };
        }
        if (!record.likes.some((like) => like.user === userId)) {
          tx.unchanged();
          return { status: 'not-liked' };
        }
        record.likes = record.likes.filter((like) => like.user !== userId);
        return { status: 'unliked', likes: record.likes.map(toLikeView) };
      }),

    addComment: (id, userId, text) =>
      db.write((draft, tx) => {
        const record = find(draft, id);
        const author = isValidId(userId)
          ? draft.users.find((user) => user._id === userId)
          : undefined;
        if (!record || !author) {
          tx.unchanged();
          return null;
        }
        record.comments.unshift({
          _id: newId(),
          user: userId,
          comment: cleanComment(text),
          date: new Date().toISOString(),
        });
        const byId = usersById(draft.users);
        return record.comments.map((comment) => toCommentView(comment, byId));
      }),

    removeComment: (id, commentId) =>
      db.write((draft, tx) => {
        const record = find(draft, id);
        if (!record) {
          tx.unchanged();
          return 'post-not-found' as const;
        }
        const index = record.comments.findIndex((comment) => comment._id === commentId);
        if (index === -1) {
          tx.unchanged();
          return 'comment-not-found' as const;
        }
        record.comments.splice(index, 1);
        return 'removed' as const;
      }),

    async getComment(id, commentId) {
      const record = find(db.read(), id);
      const comment = record?.comments.find((item) => item._id === commentId);
      return comment ? { userId: comment.user } : null;
    },

    insertMany: (posts) =>
      db.write((draft) => {
        const records = posts.map(buildPost);
        const ids = new Set(draft.posts.map((post) => post._id));
        for (const record of records) {
          if (ids.has(record._id)) throw new StoreValidationError('Path `_id` is already used.');
          ids.add(record._id);
        }
        draft.posts.push(...records);
        return records.length;
      }),
  };
}
