import { isValidId, newId } from '../../lib/ids.js';
import { StoreValidationError } from '../errors.js';
import { cleanEmail, cleanName, requireHash } from '../rules.js';
import { DEFAULT_AVATAR, toPublicUser, toUser } from '../views.js';
import { toUserRecord, USER_SECRET_SELECT } from './records.js';
import { findPage, guard, oid, trust } from './support.js';

const ROLES = new Set(['user', 'admin']);
const STATUSES = new Set(['pending', 'active']);

// Builds the document to insert from repo input (used by createPending and create).
function buildDoc(data, defaultStatus) {
  const status = data.status ?? defaultStatus;
  const role = data.role ?? 'user';
  if (!STATUSES.has(status))
    throw new StoreValidationError('Path `status` is not a valid enum value.');
  if (!ROLES.has(role)) throw new StoreValidationError('Path `role` is not a valid enum value.');
  if (data._id !== undefined && !isValidId(data._id))
    throw new StoreValidationError('Path `_id` is not a valid id.');
  const now = new Date();
  const createdAt = data.createdAt ? new Date(data.createdAt) : now;
  const doc = {
    _id: oid(data._id ?? newId()),
    avatar: data.avatar || DEFAULT_AVATAR,
    name: cleanName(data.name),
    email: cleanEmail(data.email),
    password: requireHash(data.passwordHash),
    role,
    status,
    createdAt,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : data.createdAt ? createdAt : now,
  };
  if (data.socials && Object.keys(data.socials).length > 0) doc.socials = { ...data.socials };
  if (data.activationHash) doc.activationToken = data.activationHash;
  if (data.activationExpires) doc.activationExpires = new Date(data.activationExpires);
  if (data.resetHash) doc.resetPasswordLink = data.resetHash;
  if (data.resetExpires) doc.resetPasswordExpires = new Date(data.resetExpires);
  if (data.passwordChangedAt) doc.passwordChangedAt = new Date(data.passwordChangedAt);
  return doc;
}

/**
 * @param {{User: import('mongoose').Model}} models
 * @returns {import('../types.js').UserRepo}
 */
export function createUserRepo({ User }) {
  const view = (doc, opts) => (doc ? toUser(toUserRecord(doc), opts) : null);
  const byId = (id) => (isValidId(id) ? { _id: oid(id) } : null);
  // Runs an update on one user by id; an invalid or unknown id gives null.
  async function updateOne(id, update, { secrets = false } = {}) {
    const filter = byId(id);
    if (!filter) return null;
    let query = User.findOneAndUpdate(filter, update, { returnDocument: 'after' }).lean();
    if (secrets) query = query.select(USER_SECRET_SELECT);
    return view(await guard(query));
  }

  return {
    async findById(id, { secrets = false } = {}) {
      const filter = byId(id);
      if (!filter) return null;
      let query = User.findOne(filter).lean();
      if (secrets) query = query.select(USER_SECRET_SELECT);
      return view(await query, { secrets });
    },

    async findPublicById(id) {
      const filter = byId(id);
      if (!filter) return null;
      const doc = await User.findOne(filter).lean();
      return doc && doc.status !== 'pending' ? toPublicUser(toUserRecord(doc)) : null;
    },

    async findByEmail(email, { secrets = false } = {}) {
      if (typeof email !== 'string') return null;
      let query = User.findOne({ email: email.trim().toLowerCase() }).lean();
      if (secrets) query = query.select(USER_SECRET_SELECT);
      return view(await query, { secrets });
    },

    async findByActivationHash(hash) {
      if (typeof hash !== 'string' || !hash) return null;
      const doc = await User.findOne({ activationToken: hash })
        .select('+activationToken +activationExpires')
        .lean();
      if (!doc) return null;
      const user = view(doc);
      if (doc.activationExpires) user.activationExpires = new Date(doc.activationExpires);
      return user;
    },

    async findByResetHash(hash) {
      if (typeof hash !== 'string' || !hash) return null;
      const doc = await User.findOne({
        resetPasswordLink: hash,
        resetPasswordExpires: trust({ $gt: new Date() }),
      }).lean();
      return view(doc);
    },

    async listPublic({ cursor, limit } = {}) {
      const { rows, nextCursor } = await findPage(
        User,
        { status: trust({ $ne: 'pending' }) },
        {
          cursor,
          limit,
          field: 'createdAt',
          direction: 'asc',
        },
      );
      return { items: rows.map((doc) => toPublicUser(toUserRecord(doc))), nextCursor };
    },

    async createPending({ name, email, passwordHash, activationHash, activationExpires }) {
      const doc = buildDoc(
        { name, email, passwordHash, activationHash, activationExpires, status: 'pending' },
        'pending',
      );
      const created = await guard(User.create(doc));
      return view(created.toObject());
    },

    async refreshPending(id, { name, passwordHash, activationHash, activationExpires }) {
      return updateOne(id, {
        $set: {
          name: cleanName(name),
          password: requireHash(passwordHash),
          status: 'pending',
          activationToken: activationHash,
          activationExpires: new Date(activationExpires),
        },
      });
    },

    async create(data) {
      const created = await guard(User.create(buildDoc(data, 'active')));
      return view(created.toObject());
    },

    // The hash stays on purpose: using the link a second time answers 409, not "expired".
    activate: (id) =>
      updateOne(id, { $set: { status: 'active' }, $unset: { activationExpires: 1 } }),

    async updateProfile(id, { name, avatar } = {}) {
      const set = {};
      if (name !== undefined) set.name = cleanName(name);
      if (avatar !== undefined) set.avatar = avatar || DEFAULT_AVATAR;
      return updateOne(id, { $set: set });
    },

    // Only the networks that were sent change; '' clears one by storing an empty string.
    async updateSocials(id, fields = {}) {
      const set = {};
      for (const key of ['facebook', 'linkedin', 'twitter']) {
        if (fields[key] !== undefined) set[`socials.${key}`] = String(fields[key]);
      }
      return updateOne(id, { $set: set });
    },

    async setResetToken(id, hash, expires) {
      await updateOne(id, {
        $set: { resetPasswordLink: hash, resetPasswordExpires: new Date(expires) },
      });
    },

    // Clearing the hash makes the link single-use; passwordChangedAt ends older sessions.
    consumeReset: (id, passwordHash) =>
      updateOne(id, {
        $set: { password: requireHash(passwordHash), passwordChangedAt: new Date() },
        $unset: { resetPasswordLink: 1, resetPasswordExpires: 1 },
      }),

    async deleteById(id) {
      const filter = byId(id);
      if (!filter) return false;
      const result = await User.deleteOne(filter);
      return (result.deletedCount ?? 0) > 0;
    },
  };
}
