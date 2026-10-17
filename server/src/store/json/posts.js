import { isValidId, newId } from '../../lib/ids.js';
import { paginate } from '../../lib/pagination.js';
import { StoreValidationError } from '../errors.js';
import { DEFAULT_AVATAR, toCommentView, toLikeView, toPostView, userIndex } from './views.js';

const TITLE_MAX = 100;
const DEFAULT_TAG = 'general';
const DEFAULT_IMAGE = DEFAULT_AVATAR;

const iso = (value) => new Date(value).toISOString();

const cleanTitle = (value) => {
  const title = typeof value === 'string' ? value.trim() : '';
  if (!title) throw new StoreValidationError('Path `title` is required.');
  if (title.length > TITLE_MAX) {
    throw new StoreValidationError(`Path \`title\` is longer than the maximum allowed length (${TITLE_MAX}).`);
  }
  return title;
};

const cleanDescription = (value) => {
  if (typeof value !== 'string' || value === '') throw new StoreValidationError('Path `description` is required.');
  return value;
};

const cleanComment = (value) => {
  if (typeof value !== 'string' || value === '') throw new StoreValidationError('Path `comment` is required.');
  return value;
};

// Newest first, with the id as a tie-break so the order is stable.
const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a._id < b._id ? 1 : -1);
const byDateAsc = (a, b) => -byDateDesc(a, b);

function buildPost(data) {
  if (data._id !== undefined && !isValidId(data._id)) throw new StoreValidationError('Path `_id` is not a valid id.');
  return {
    _id: data._id ?? newId(),
    user: data.user,
    image: data.image || DEFAULT_IMAGE,
    title: cleanTitle(data.title),
    tag: data.tag || DEFAULT_TAG,
    description: cleanDescription(data.description),
    likes: (data.likes ?? []).map((like) => ({ _id: like._id ?? newId(), user: like.user })),
    comments: (data.comments ?? []).map((comment) => ({
      _id: comment._id ?? newId(),
      user: comment.user ?? comment.userId,
      comment: cleanComment(comment.comment),
      date: comment.date ? iso(comment.date) : new Date().toISOString(),
    })),
    date: data.date ? iso(data.date) : new Date().toISOString(),
  };
}

/** @returns {import('../types.js').PostRepo} */
export function createPostRepo(db) {
  const find = (state, id) => (isValidId(id) ? state.posts.find((post) => post._id === id) : undefined);
  const authors = () => userIndex(db.read()).byId;

  return {
    async findById(id) {
      const record = find(db.read(), id);
      return record ? toPostView(record, authors(), 'detail') : null;
    },

    async list({ cursor, limit } = {}) {
      const rows = [...db.read().posts].sort(byDateDesc);
      const page = paginate(rows, { cursor, limit, key: (post) => post.date, direction: 'desc' });
      const byId = authors();
      return { items: page.items.map((post) => toPostView(post, byId, 'list')), nextCursor: page.nextCursor };
    },

    async listByUser(userId, { cursor, limit } = {}) {
      // Oldest first: the order this endpoint has always returned (insertion order).
      const rows = db
        .read()
        .posts.filter((post) => post.user === userId)
        .sort(byDateAsc);
      const page = paginate(rows, { cursor, limit, key: (post) => post.date, direction: 'asc' });
      const byId = authors();
      return { items: page.items.map((post) => toPostView(post, byId, 'list')), nextCursor: page.nextCursor };
    },

    create: ({ user, title, tag, description, image }) =>
      db.write((draft) => {
        const record = buildPost({ user, title, tag, description, image });
        draft.posts.push(record);
        return toPostView(record, new Map(), 'id');
      }),

    update: (id, fields = {}) =>
      db.write((draft, tx) => {
        const record = find(draft, id);
        if (!record) {
          tx.unchanged();
          return null;
        }
        if (fields.title !== undefined) record.title = cleanTitle(fields.title);
        if (fields.description !== undefined) record.description = cleanDescription(fields.description);
        if (fields.tag !== undefined) record.tag = fields.tag || DEFAULT_TAG;
        if (fields.image !== undefined) record.image = fields.image || DEFAULT_IMAGE;
        return toPostView(record, new Map(draft.users.map((user) => [user._id, user])), 'id');
      }),

    async getOwnerAndImage(id) {
      const record = find(db.read(), id);
      return record ? { user: record.user, image: record.image } : null;
    },

    delete: (id) =>
      db.write((draft, tx) => {
        const index = isValidId(id) ? draft.posts.findIndex((post) => post._id === id) : -1;
        if (index === -1) {
          tx.unchanged();
          return null;
        }
        const [removed] = draft.posts.splice(index, 1);
        return { image: removed.image };
      }),

    async exists(id) {
      return find(db.read(), id) !== undefined;
    },

    // Runs in the write queue, so two parallel calls by one user can never both add a like.
    like: (id, userId) =>
      db.write((draft, tx) => {
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
      db.write((draft, tx) => {
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
        const author = isValidId(userId) ? draft.users.find((user) => user._id === userId) : undefined;
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
        const byId = new Map(draft.users.map((user) => [user._id, user]));
        return record.comments.map((comment) => toCommentView(comment, byId));
      }),

    removeComment: (id, commentId) =>
      db.write((draft, tx) => {
        const record = find(draft, id);
        if (!record) {
          tx.unchanged();
          return 'post-not-found';
        }
        const index = record.comments.findIndex((comment) => comment._id === commentId);
        if (index === -1) {
          tx.unchanged();
          return 'comment-not-found';
        }
        record.comments.splice(index, 1);
        return 'removed';
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
