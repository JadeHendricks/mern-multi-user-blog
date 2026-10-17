import { DEFAULT_AVATAR } from '@mern-blog/shared';
import type { PopulateOptions, QueryFilter, Types } from 'mongoose';
import { isValidId, newId } from '../../lib/ids.js';
import type { PageOptions } from '../../lib/pagination.js';
import { StoreValidationError } from '../errors.js';
import { cleanComment, cleanDescription, cleanTitle, orDefault } from '../rules.js';
import type { PostRepo, PostInput } from '../types.js';
import { toCommentView, toLikeView, toPostView } from '../views.js';
import type { PostAuthor, PostViewMode } from '../views.js';
import type { LeanAuthor, LeanPost, PostModel, PostSchema } from './post-model.js';
import { idOf, toLikeRecords, toPostRecord, toSocials } from './records.js';
import { guard, oid, pageWindow, trust } from './support.js';
import type { UserModel } from './user-model.js';

const DEFAULT_TAG = 'general';

const asUserOid = (value: unknown): Types.ObjectId => {
  if (!isValidId(value)) throw new StoreValidationError('Path `user` is not a valid id.');
  return oid(value);
};

// A missing author is filled with the stored id (instead of null), so a comment keeps its userId.
const keepId = (doc: unknown, id: unknown): unknown => doc ?? id;
// Authors are populated on read, so names and avatars are always the current ones.
const POPULATE: PopulateOptions[] = [
  { path: 'user', select: 'name avatar socials', transform: keepId },
  { path: 'comments.user', select: 'name avatar', transform: keepId },
];

/** The document to insert for a post (used by create and insertMany). */
interface NewPostDoc {
  _id: Types.ObjectId;
  user?: Types.ObjectId;
  image: string;
  title: string;
  tag: string;
  description: string;
  likes: { _id: Types.ObjectId; user: Types.ObjectId }[];
  comments: { _id: Types.ObjectId; user: Types.ObjectId; comment: string; date: Date }[];
  date: Date;
}

function buildDoc(data: PostInput): NewPostDoc {
  if (data._id !== undefined && !isValidId(data._id))
    throw new StoreValidationError('Path `_id` is not a valid id.');
  const doc: NewPostDoc = {
    _id: oid(data._id ?? newId()),
    image: orDefault(data.image, DEFAULT_AVATAR),
    title: cleanTitle(data.title),
    tag: orDefault(data.tag, DEFAULT_TAG),
    description: cleanDescription(data.description),
    likes: (data.likes ?? []).map((like) => ({
      _id: oid(like._id ?? newId()),
      user: asUserOid(like.user),
    })),
    comments: (data.comments ?? []).map((comment) => ({
      _id: oid(comment._id ?? newId()),
      user: asUserOid(comment.user),
      comment: cleanComment(comment.comment),
      date: comment.date ? new Date(comment.date) : new Date(),
    })),
    date: data.date ? new Date(data.date) : new Date(),
  };
  if (data.user) doc.user = asUserOid(data.user);
  return doc;
}

// A populated author carries a name; an id (or an author that is gone, kept as its id) does not.
const isAuthor = (value: unknown): value is LeanAuthor =>
  typeof value === 'object' && value !== null && 'name' in value && value.name !== undefined;

export function createPostRepo({ User, Post }: { User: UserModel; Post: PostModel }): PostRepo {
  // Splits the populated authors out of lean documents: stored-shape records plus a lookup of
  // every author that still exists, keyed by hex id.
  function read(docs: readonly LeanPost[]) {
    const authors = new Map<string, PostAuthor>();
    const note = (value: unknown) => {
      if (isAuthor(value)) {
        const id = idOf(value);
        authors.set(id, {
          _id: id,
          name: value.name,
          avatar: value.avatar,
          socials: toSocials(value.socials),
        });
      }
    };
    for (const doc of docs) {
      note(doc.user);
      for (const comment of doc.comments ?? []) note(comment.user);
    }
    return { records: docs.map(toPostRecord), authors };
  }

  function views(docs: readonly LeanPost[], mode: PostViewMode) {
    const { records, authors } = read(docs);
    return records.map((record) => toPostView(record, authors, mode));
  }
  // One page of posts matching `base`, newest first, with authors populated.
  async function newestFirst(base: QueryFilter<PostSchema>, page: PageOptions) {
    const window = pageWindow<PostSchema, 'date'>(base, {
      ...page,
      field: 'date',
      direction: 'desc',
    });
    let query = Post.find(window.filter).sort(window.sort).lean<LeanPost[]>().populate(POPULATE);
    if (window.fetch !== undefined) query = query.limit(window.fetch);
    return window.finish(await query);
  }
  const postFilter = (id: string) => (isValidId(id) ? { _id: oid(id) } : null);
  const exists = async (id: string): Promise<boolean> => {
    const filter = postFilter(id);
    return filter ? (await Post.findOne(filter).select('_id').lean()) !== null : false;
  };

  return {
    async findById(id) {
      const filter = postFilter(id);
      if (!filter) return null;
      const doc = await Post.findOne(filter).lean<LeanPost>().populate(POPULATE);
      return doc ? (views([doc], 'detail')[0] ?? null) : null;
    },

    async list({ cursor, limit } = {}) {
      const { rows, nextCursor } = await newestFirst({}, { cursor, limit });
      return { items: views(rows, 'list'), nextCursor };
    },

    // Newest first, like the main list (this endpoint used to return oldest first).
    async listByUser(userId, { cursor, limit } = {}) {
      if (!isValidId(userId)) return { items: [], nextCursor: null };
      const { rows, nextCursor } = await newestFirst({ user: oid(userId) }, { cursor, limit });
      return { items: views(rows, 'list'), nextCursor };
    },

    async create({ user, title, tag, description, image }) {
      const created = await guard(Post.create(buildDoc({ user, title, tag, description, image })));
      return toPostView(toPostRecord(created.toObject()), new Map<string, PostAuthor>(), 'id');
    },

    async update(id, fields = {}) {
      const filter = postFilter(id);
      if (!filter) return null;
      const set: { title?: string; description?: string; tag?: string; image?: string } = {};
      if (fields.title !== undefined) set.title = cleanTitle(fields.title);
      if (fields.description !== undefined) set.description = cleanDescription(fields.description);
      if (fields.tag !== undefined) set.tag = orDefault(fields.tag, DEFAULT_TAG);
      if (fields.image !== undefined) set.image = orDefault(fields.image, DEFAULT_AVATAR);
      const doc =
        Object.keys(set).length > 0
          ? await guard(
              Post.findOneAndUpdate(
                filter,
                { $set: set },
                { returnDocument: 'after' },
              ).lean<LeanPost>(),
            )
          : await Post.findOne(filter).lean<LeanPost>();
      return doc ? toPostView(toPostRecord(doc), new Map<string, PostAuthor>(), 'id') : null;
    },

    async getOwnerAndImage(id) {
      const filter = postFilter(id);
      if (!filter) return null;
      const doc = await Post.findOne(filter)
        .select('user image')
        .lean<{ user?: Types.ObjectId | null; image: string }>();
      return doc ? { user: doc.user ? String(doc.user) : undefined, image: doc.image } : null;
    },

    async delete(id) {
      const filter = postFilter(id);
      if (!filter) return null;
      const doc = await Post.findOneAndDelete(filter).lean<LeanPost>();
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
        .lean<Pick<LeanPost, 'likes'>>();
      if (doc) return { status: 'liked', likes: toLikeRecords(doc.likes).map(toLikeView) };
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
        .lean<Pick<LeanPost, 'likes'>>();
      if (doc) return { status: 'unliked', likes: toLikeRecords(doc.likes).map(toLikeView) };
      return { status: (await exists(id)) ? 'not-liked' : 'not-found' };
    },

    async addComment(id, userId, text) {
      const filter = postFilter(id);
      if (!filter || !isValidId(userId)) return null;
      const comment = cleanComment(text);
      if (
        !(await User.findOne({ _id: oid(userId) })
          .select('_id')
          .lean())
      )
        return null;
      const doc = await Post.findOneAndUpdate(
        filter,
        {
          $push: {
            comments: {
              $each: [{ _id: oid(newId()), user: oid(userId), comment, date: new Date() }],
              $position: 0,
            },
          },
        },
        { returnDocument: 'after' },
      )
        .lean<LeanPost>()
        .populate(POPULATE);
      if (!doc) return null;
      const { records, authors } = read([doc]);
      return (records[0]?.comments ?? []).map((item) => toCommentView(item, authors));
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
        .lean<Pick<LeanPost, 'comments'>>();
      const comment = doc?.comments?.[0];
      return comment ? { userId: idOf(comment.user) } : null;
    },

    async insertMany(posts) {
      const docs = posts.map(buildDoc);
      if (docs.length === 0) return 0;
      await guard(Post.insertMany(docs));
      return docs.length;
    },
  };
}
