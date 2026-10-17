import { isValidId, newId } from '../../lib/ids.js';
import { StoreValidationError } from '../errors.js';
import { cleanComment, cleanDescription, cleanTitle } from '../rules.js';
import { DEFAULT_AVATAR, toCommentView, toLikeView, toPostView } from '../views.js';
import { idOf, toPostRecord } from './records.js';
import { findPage, guard, oid, trust } from './support.js';

const DEFAULT_TAG = 'general';

const asUserOid = (value) => {
  if (!isValidId(value)) throw new StoreValidationError('Path `user` is not a valid id.');
  return oid(value);
};

// A missing author is filled with the stored id (instead of null), so a comment keeps its userId.
const keepId = (doc, id) => doc ?? id;
// Authors are populated on read, so names and avatars are always the current ones.
const POPULATE = [
  { path: 'user', select: 'name avatar socials', transform: keepId },
  { path: 'comments.user', select: 'name avatar', transform: keepId },
];

// The document to insert from repo input (used by create and insertMany).
function buildDoc(data) {
  if (data._id !== undefined && !isValidId(data._id)) throw new StoreValidationError('Path `_id` is not a valid id.');
  return {
    _id: oid(data._id ?? newId()),
    user: data.user ? asUserOid(data.user) : undefined,
    image: data.image || DEFAULT_AVATAR,
    title: cleanTitle(data.title),
    tag: data.tag || DEFAULT_TAG,
    description: cleanDescription(data.description),
    likes: (data.likes ?? []).map((like) => ({ _id: oid(like._id ?? newId()), user: asUserOid(like.user) })),
    comments: (data.comments ?? []).map((comment) => ({
      _id: oid(comment._id ?? newId()),
      user: asUserOid(comment.user),
      comment: cleanComment(comment.comment),
      date: comment.date ? new Date(comment.date) : new Date(),
    })),
    date: data.date ? new Date(data.date) : new Date(),
  };
}

/**
 * @param {{User: import('mongoose').Model, Post: import('mongoose').Model}} models
 * @returns {import('../types.js').PostRepo}
 */
export function createPostRepo({ User, Post }) {
  // Splits the populated authors out of lean documents: stored-shape records plus a lookup of
  // every author that still exists, keyed by hex id.
  function read(docs) {
    const authors = new Map();
    const note = (value) => {
      if (value && value.name !== undefined) authors.set(idOf(value), { ...value, _id: idOf(value) });
    };
    for (const doc of docs) {
      note(doc.user);
      for (const comment of doc.comments ?? []) note(comment.user);
    }
    return { records: docs.map(toPostRecord), authors };
  }

  function views(docs, mode) {
    const { records, authors } = read(docs);
    return records.map((record) => toPostView(record, authors, mode));
  }
  const postFilter = (id) => (isValidId(id) ? { _id: oid(id) } : null);
  const exists = async (id) => {
    const filter = postFilter(id);
    return filter ? (await Post.findOne(filter).select('_id').lean()) !== null : false;
  };

  return {
    async findById(id) {
      const filter = postFilter(id);
      if (!filter) return null;
      const doc = await Post.findOne(filter).populate(POPULATE).lean();
      return doc ? views([doc], 'detail')[0] : null;
    },

    async list({ cursor, limit } = {}) {
      const { rows, nextCursor } = await findPage(Post, {}, { cursor, limit, field: 'date', direction: 'desc', populate: POPULATE });
      return { items: views(rows, 'list'), nextCursor };
    },

    // Oldest first: the order this endpoint has always returned.
    async listByUser(userId, { cursor, limit } = {}) {
      if (!isValidId(userId)) return { items: [], nextCursor: null };
      const { rows, nextCursor } = await findPage(Post, { user: oid(userId) }, { cursor, limit, field: 'date', direction: 'asc', populate: POPULATE });
      return { items: views(rows, 'list'), nextCursor };
    },

    async create({ user, title, tag, description, image }) {
      const created = await guard(Post.create(buildDoc({ user, title, tag, description, image })));
      return toPostView(toPostRecord(created.toObject()), new Map(), 'id');
    },

    async update(id, fields = {}) {
      const filter = postFilter(id);
      if (!filter) return null;
      const set = {};
      if (fields.title !== undefined) set.title = cleanTitle(fields.title);
      if (fields.description !== undefined) set.description = cleanDescription(fields.description);
      if (fields.tag !== undefined) set.tag = fields.tag || DEFAULT_TAG;
      if (fields.image !== undefined) set.image = fields.image || DEFAULT_AVATAR;
      const doc =
        Object.keys(set).length > 0
          ? await guard(Post.findOneAndUpdate(filter, { $set: set }, { returnDocument: 'after' }).lean())
          : await Post.findOne(filter).lean();
      return doc ? toPostView(toPostRecord(doc), new Map(), 'id') : null;
    },

    async getOwnerAndImage(id) {
      const filter = postFilter(id);
      if (!filter) return null;
      const doc = await Post.findOne(filter).select('user image').lean();
      return doc ? { user: doc.user ? String(doc.user) : undefined, image: doc.image } : null;
    },

    async delete(id) {
      const filter = postFilter(id);
      if (!filter) return null;
      const doc = await Post.findOneAndDelete(filter).lean();
      return doc ? { image: doc.image } : null;
    },

    exists,

    // One conditional update, so two parallel calls by one user can never both add a like.
    async like(id, userId) {
      const filter = postFilter(id);
      if (!filter || !isValidId(userId)) return { status: 'not-found' };
      const doc = await Post.findOneAndUpdate(
        { ...filter, 'likes.user': trust({ $ne: oid(userId) }) },
        { $push: { likes: { $each: [{ _id: oid(newId()), user: oid(userId) }], $position: 0 } } },
        { returnDocument: 'after' },
      )
        .select('likes')
        .lean();
      if (doc) return { status: 'liked', likes: toPostRecord(doc).likes.map(toLikeView) };
      return { status: (await exists(id)) ? 'already' : 'not-found' };
    },

    async unlike(id, userId) {
      const filter = postFilter(id);
      if (!filter || !isValidId(userId)) return { status: 'not-found' };
      const doc = await Post.findOneAndUpdate(
        { ...filter, 'likes.user': oid(userId) },
        { $pull: { likes: { user: oid(userId) } } },
        { returnDocument: 'after' },
      )
        .select('likes')
        .lean();
      if (doc) return { status: 'unliked', likes: toPostRecord(doc).likes.map(toLikeView) };
      return { status: (await exists(id)) ? 'not-liked' : 'not-found' };
    },

    async addComment(id, userId, text) {
      const filter = postFilter(id);
      if (!filter || !isValidId(userId)) return null;
      const comment = cleanComment(text);
      if (!(await User.findOne({ _id: oid(userId) }).select('_id').lean())) return null;
      const doc = await Post.findOneAndUpdate(
        filter,
        { $push: { comments: { $each: [{ _id: oid(newId()), user: oid(userId), comment, date: new Date() }], $position: 0 } } },
        { returnDocument: 'after' },
      )
        .populate(POPULATE)
        .lean();
      if (!doc) return null;
      const { records, authors } = read([doc]);
      return records[0].comments.map((item) => toCommentView(item, authors));
    },

    async removeComment(id, commentId) {
      const filter = postFilter(id);
      if (!filter) return 'post-not-found';
      if (!isValidId(commentId)) return (await exists(id)) ? 'comment-not-found' : 'post-not-found';
      const doc = await Post.findOneAndUpdate(
        { ...filter, 'comments._id': oid(commentId) },
        { $pull: { comments: { _id: oid(commentId) } } },
        { returnDocument: 'after' },
      )
        .select('_id')
        .lean();
      if (doc) return 'removed';
      return (await exists(id)) ? 'comment-not-found' : 'post-not-found';
    },

    async getComment(id, commentId) {
      const filter = postFilter(id);
      if (!filter || !isValidId(commentId)) return null;
      const doc = await Post.findOne({ ...filter, 'comments._id': oid(commentId) })
        .select({ comments: { $elemMatch: { _id: oid(commentId) } } })
        .lean();
      return doc ? { userId: idOf(doc.comments[0].user) } : null;
    },

    async insertMany(posts) {
      const docs = posts.map(buildDoc);
      if (docs.length === 0) return 0;
      await guard(Post.insertMany(docs));
      return docs.length;
    },
  };
}
