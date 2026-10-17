import { DEFAULT_AVATAR } from '@mern-blog/shared';
import type { Types, UpdateQuery } from 'mongoose';
import { isValidId, newId } from '../../lib/ids.js';
import { StoreValidationError } from '../errors.js';
import { cleanEmail, cleanName, orDefault, requireHash } from '../rules.js';
import type { SecretsOption, User, UserInput, UserRepo, UserStatus } from '../types.js';
import { toPublicUser, toUser } from '../views.js';
import { toSocials, toUserRecord, USER_SECRET_SELECT } from './records.js';
import { guard, oid, pageWindow, trust } from './support.js';
import type { LeanUser, UserModel, UserSchema } from './user-model.js';

const ROLES = new Set<string>(['user', 'admin']);
const STATUSES = new Set<string>(['pending', 'active']);

/** A user document to insert (the secret columns are optional here). */
type NewUserDoc = Partial<UserSchema> & { _id: Types.ObjectId };

// Builds the document to insert from repo input (used by createPending and create).
function buildDoc(data: UserInput, defaultStatus: UserStatus): NewUserDoc {
  const status = data.status ?? defaultStatus;
  const role = data.role ?? 'user';
  if (!STATUSES.has(status))
    throw new StoreValidationError('Path `status` is not a valid enum value.');
  if (!ROLES.has(role)) throw new StoreValidationError('Path `role` is not a valid enum value.');
  if (data._id !== undefined && !isValidId(data._id))
    throw new StoreValidationError('Path `_id` is not a valid id.');
  const now = new Date();
  const createdAt = data.createdAt ? new Date(data.createdAt) : now;
  const doc: NewUserDoc = {
    _id: oid(data._id ?? newId()),
    avatar: orDefault(data.avatar, DEFAULT_AVATAR),
    name: cleanName(data.name),
    email: cleanEmail(data.email),
    password: requireHash(data.passwordHash),
    role,
    status,
    createdAt,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : data.createdAt ? createdAt : now,
  };
  const socials =
    data.socials && Object.keys(data.socials).length > 0 ? toSocials(data.socials) : undefined;
  if (socials) doc.socials = socials;
  if (data.activationHash) doc.activationToken = data.activationHash;
  if (data.activationExpires) doc.activationExpires = new Date(data.activationExpires);
  if (data.resetHash) doc.resetPasswordLink = data.resetHash;
  if (data.resetExpires) doc.resetPasswordExpires = new Date(data.resetExpires);
  if (data.passwordChangedAt) doc.passwordChangedAt = new Date(data.passwordChangedAt);
  return doc;
}

export function createUserRepo({ User }: { User: UserModel }): UserRepo {
  const view = (doc: LeanUser | null, opts?: SecretsOption): User | null =>
    doc ? toUser(toUserRecord(doc), opts) : null;
  const byId = (id: string) => (isValidId(id) ? { _id: oid(id) } : null);
  // Runs an update on one user by id; an invalid or unknown id gives null.
  async function updateOne(id: string, update: UpdateQuery<UserSchema>): Promise<User | null> {
    const filter = byId(id);
    if (!filter) return null;
    return view(
      await guard(
        User.findOneAndUpdate(filter, update, { returnDocument: 'after' }).lean<LeanUser>(),
      ),
    );
  }

  // The methods that look something up by a value from a request take `unknown` here, so a value
  // of the wrong type is a plain "not found" (the interface itself asks for strings).
  return {
    async findById(id, { secrets = false } = {}) {
      const filter = byId(id);
      if (!filter) return null;
      let query = User.findOne(filter).lean<LeanUser>();
      if (secrets) query = query.select(USER_SECRET_SELECT);
      return view(await query, { secrets });
    },

    async findPublicById(id) {
      const filter = byId(id);
      if (!filter) return null;
      const doc = await User.findOne(filter).lean<LeanUser>();
      return doc && doc.status !== 'pending' ? toPublicUser(toUserRecord(doc)) : null;
    },

    async findByEmail(email: unknown, { secrets = false } = {}) {
      if (typeof email !== 'string') return null;
      let query = User.findOne({ email: email.trim().toLowerCase() }).lean<LeanUser>();
      if (secrets) query = query.select(USER_SECRET_SELECT);
      return view(await query, { secrets });
    },

    async findByActivationHash(hash: unknown) {
      if (typeof hash !== 'string' || !hash) return null;
      const doc = await User.findOne({ activationToken: hash })
        .select('+activationToken +activationExpires')
        .lean<LeanUser>();
      if (!doc) return null;
      const user = toUser(toUserRecord(doc));
      if (doc.activationExpires) user.activationExpires = new Date(doc.activationExpires);
      return user;
    },

    async findByResetHash(hash: unknown) {
      if (typeof hash !== 'string' || !hash) return null;
      const doc = await User.findOne({
        resetPasswordLink: hash,
        resetPasswordExpires: trust({ $gt: new Date() }),
      }).lean<LeanUser>();
      return view(doc);
    },

    async listPublic({ cursor, limit } = {}) {
      const window = pageWindow<UserSchema, 'createdAt'>(
        { status: trust<{ $ne: UserStatus }>({ $ne: 'pending' }) },
        { cursor, limit, field: 'createdAt', direction: 'asc' },
      );
      let query = User.find(window.filter).sort(window.sort).lean<LeanUser[]>();
      if (window.fetch !== undefined) query = query.limit(window.fetch);
      const { rows, nextCursor } = window.finish(await query);
      return { items: rows.map((doc) => toPublicUser(toUserRecord(doc))), nextCursor };
    },

    async createPending({ name, email, passwordHash, activationHash, activationExpires }) {
      const doc = buildDoc(
        { name, email, passwordHash, activationHash, activationExpires, status: 'pending' },
        'pending',
      );
      const created = await guard(User.create(doc));
      return toUser(toUserRecord(created.toObject()));
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
      return toUser(toUserRecord(created.toObject()));
    },

    // The hash stays on purpose: using the link a second time answers 409, not "expired".
    activate: (id) =>
      updateOne(id, { $set: { status: 'active' }, $unset: { activationExpires: 1 } }),

    async updateProfile(id, { name, avatar } = {}) {
      const set: Partial<Pick<UserSchema, 'name' | 'avatar'>> = {};
      if (name !== undefined) set.name = cleanName(name);
      if (avatar !== undefined) set.avatar = orDefault(avatar, DEFAULT_AVATAR);
      return updateOne(id, { $set: set });
    },

    // Only the networks that were sent change; '' clears one by storing an empty string.
    async updateSocials(id, fields = {}) {
      const set: Record<string, string> = {};
      for (const key of ['facebook', 'linkedin', 'twitter'] as const) {
        const value = fields[key];
        if (value !== undefined) set[`socials.${key}`] = value;
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
      return result.deletedCount > 0;
    },
  };
}
