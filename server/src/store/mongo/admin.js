import { isValidId } from '../../lib/ids.js';
import { StoreError } from '../errors.js';
import { migrate } from '../json/migrations.js';
import { assertImportable, cleanEmail } from '../rules.js';
import { toRawUser } from '../views.js';
import {
  columnOf,
  toColumnValue,
  toExportPost,
  toExportUser,
  toPostRecord,
  toUserDoc,
  toUserRecord,
  USER_SECRET_SELECT,
} from './records.js';
import { guard, matched, oid } from './support.js';

const latestExportVersion = () => migrate({ users: [], posts: [] }).schemaVersion;

// The post document for an exported post: ids as ObjectIds, comments keyed by their author's id.
function toPostDoc(post) {
  const asId = (value) => {
    if (!isValidId(value)) throw new StoreError('Import has an invalid id in a post.');
    return oid(value);
  };
  return {
    _id: asId(post._id),
    user: post.user ? asId(post.user) : undefined,
    image: post.image,
    title: post.title,
    tag: post.tag,
    description: post.description,
    likes: (post.likes ?? []).map((like) => ({ _id: asId(like._id), user: asId(like.user) })),
    comments: (post.comments ?? []).map((comment) => ({
      _id: asId(comment._id),
      user: asId(comment.user),
      comment: comment.comment,
      date: new Date(comment.date),
    })),
    date: new Date(post.date),
  };
}

/**
 * @param {{User: import('mongoose').Model, Post: import('mongoose').Model}} models
 * @returns {import('../types.js').StoreAdmin}
 */
export function createAdmin({ User, Post }) {
  const counts = async () => ({
    users: await User.countDocuments({}),
    posts: await Post.countDocuments({}),
  });

  return {
    async exportAll() {
      const [users, posts] = await Promise.all([
        User.find({}).select(USER_SECRET_SELECT).sort({ _id: 1 }).lean(),
        Post.find({}).sort({ _id: 1 }).lean(),
      ]);
      return {
        schemaVersion: latestExportVersion(),
        users: users.map((doc) => toExportUser(toUserRecord(doc))),
        posts: posts.map((doc) => toExportPost(toPostRecord(doc))),
      };
    },

    // Validates everything first, then replaces the data. Mongo has no multi-collection
    // transaction here (a standalone local server), so a failure part way can leave a partial load.
    async importAll(data, { replace = false } = {}) {
      if (!data || !Array.isArray(data.users) || !Array.isArray(data.posts)) {
        throw new StoreError('Import file must contain "users" and "posts" lists.');
      }
      const next = migrate(structuredClone(data));
      assertImportable(next);
      const userDocs = next.users.map((user) =>
        toUserDoc({ ...user, email: cleanEmail(user.email) }, oid),
      );
      const postDocs = next.posts.map(toPostDoc);
      const current = await counts();
      if (!replace && (current.users > 0 || current.posts > 0)) {
        throw new StoreError('The store is not empty. Import with replace to overwrite it.');
      }
      await Promise.all([User.deleteMany({}), Post.deleteMany({})]);
      // The raw collection keeps the exported ids, dates and updatedAt exactly as they are.
      if (userDocs.length > 0) await guard(User.collection.insertMany(userDocs));
      if (postDocs.length > 0) await guard(Post.collection.insertMany(postDocs));
      return { users: userDocs.length, posts: postDocs.length };
    },

    async reset() {
      await Promise.all([User.deleteMany({}), Post.deleteMany({})]);
    },

    counts,

    // The indexes beyond _id, for the tests: { users: [{ key, unique }], posts: [...] }.
    async indexes() {
      const pick = (list) =>
        list
          .filter((index) => index.name !== '_id_')
          .map((index) => ({ key: index.key, unique: index.unique === true }));
      const [users, posts] = await Promise.all([User.listIndexes(), Post.listIndexes()]);
      return { users: pick(users), posts: pick(posts) };
    },

    // The stored user including secrets, under the repo's own field names.
    async rawUserByEmail(email) {
      if (typeof email !== 'string') return null;
      const doc = await User.findOne({ email: email.trim().toLowerCase() })
        .select(USER_SECRET_SELECT)
        .lean();
      return doc ? toRawUser(toUserRecord(doc)) : null;
    },

    // Overwrites stored fields as they are (tests use it to move expiry dates into the past).
    // A null or undefined value removes the field.
    async patchUser(id, fields) {
      if (!isValidId(id)) return false;
      const $set = {};
      const $unset = {};
      for (const [key, value] of Object.entries(fields)) {
        const column = columnOf(key);
        if (value === undefined || value === null) $unset[column] = 1;
        else $set[column] = toColumnValue(column, value);
      }
      const update = {};
      if (Object.keys($set).length > 0) update.$set = $set;
      if (Object.keys($unset).length > 0) update.$unset = $unset;
      // timestamps off: patching must not move updatedAt on its own.
      const result = await User.updateOne({ _id: oid(id) }, update, {
        timestamps: false,
        strict: false,
      });
      return matched(result) > 0;
    },
  };
}
