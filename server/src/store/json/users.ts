import { DEFAULT_AVATAR } from '@mern-blog/shared';
import { isValidId, newId } from '../../lib/ids.js';
import { paginate } from '../../lib/pagination.js';
import { DuplicateEmailError, StoreValidationError } from '../errors.js';
import { cleanEmail, cleanName, orDefault, requireHash } from '../rules.js';
import type { UserInput, UserRepo, UserStatus } from '../types.js';
import { toPublicUser, toUser, userIndex } from '../views.js';
import type { FileDb } from './file-db.js';
import type { JsonState, StoredUser } from './records.js';

const ROLES = new Set<string>(['user', 'admin']);
const STATUSES = new Set<string>(['pending', 'active']);

const iso = (value: Date | string): string => new Date(value).toISOString();

const present = <T>(value: T | null | undefined): value is T =>
  value !== undefined && value !== null;

// The unique-email rule, checked on the draft so it also holds for writes queued back to back.
const assertEmailFree = (draft: JsonState, email: string, exceptId?: string): void => {
  if (draft.users.some((user) => user.email === email && user._id !== exceptId))
    throw new DuplicateEmailError();
};

// Builds a stored record from repo input (used by createPending and create).
function buildRecord(data: UserInput, defaults: { status: UserStatus }): StoredUser {
  const stamp = new Date().toISOString();
  const status = data.status ?? defaults.status;
  const role = data.role ?? 'user';
  if (!STATUSES.has(status))
    throw new StoreValidationError('Path `status` is not a valid enum value.');
  if (!ROLES.has(role)) throw new StoreValidationError('Path `role` is not a valid enum value.');
  if (data._id !== undefined && !isValidId(data._id))
    throw new StoreValidationError('Path `_id` is not a valid id.');
  const record: StoredUser = {
    _id: data._id ?? newId(),
    avatar: orDefault(data.avatar, DEFAULT_AVATAR),
    name: cleanName(data.name),
    email: cleanEmail(data.email),
    passwordHash: requireHash(data.passwordHash),
    role,
    status,
    createdAt: data.createdAt ? iso(data.createdAt) : stamp,
    updatedAt: data.updatedAt ? iso(data.updatedAt) : data.createdAt ? iso(data.createdAt) : stamp,
  };
  if (data.socials && Object.keys(data.socials).length > 0) record.socials = { ...data.socials };
  if (present(data.passwordChangedAt)) record.passwordChangedAt = iso(data.passwordChangedAt);
  if (present(data.activationHash)) record.activationHash = data.activationHash;
  if (present(data.activationExpires)) record.activationExpires = iso(data.activationExpires);
  if (present(data.resetHash)) record.resetHash = data.resetHash;
  if (present(data.resetExpires)) record.resetExpires = iso(data.resetExpires);
  return record;
}

export function createUserRepo(db: FileDb): UserRepo {
  const find = (id: string) => (isValidId(id) ? userIndex(db.read()).byId.get(id) : undefined);
  const findInDraft = (draft: JsonState, id: string) =>
    isValidId(id) ? draft.users.find((user) => user._id === id) : undefined;
  const touch = (record: StoredUser) => {
    record.updatedAt = new Date().toISOString();
  };

  // The methods that look something up by a value from a request take `unknown` here, so a value
  // of the wrong type is a plain "not found" (the interface itself asks for strings).
  return {
    async findById(id, { secrets = false } = {}) {
      const record = find(id);
      return record ? toUser(record, { secrets }) : null;
    },

    async findPublicById(id) {
      const record = find(id);
      return record && record.status !== 'pending' ? toPublicUser(record) : null;
    },

    async findByEmail(email: unknown, { secrets = false } = {}) {
      if (typeof email !== 'string') return null;
      const record = userIndex(db.read()).byEmail.get(email.trim().toLowerCase());
      return record ? toUser(record, { secrets }) : null;
    },

    async findByActivationHash(hash: unknown) {
      if (typeof hash !== 'string' || !hash) return null;
      const record = db.read().users.find((user) => user.activationHash === hash);
      if (!record) return null;
      const user = toUser(record);
      if (record.activationExpires) user.activationExpires = new Date(record.activationExpires);
      return user;
    },

    async findByResetHash(hash: unknown) {
      if (typeof hash !== 'string' || !hash) return null;
      const now = Date.now();
      const record = db
        .read()
        .users.find(
          (user) =>
            user.resetHash === hash &&
            user.resetExpires &&
            new Date(user.resetExpires).getTime() > now,
        );
      return record ? toUser(record) : null;
    },

    async listPublic({ cursor, limit } = {}) {
      const rows = db
        .read()
        .users.filter((user) => user.status !== 'pending')
        .sort((a, b) =>
          a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : a._id < b._id ? -1 : 1,
        );
      const page = paginate(rows, {
        cursor,
        limit,
        key: (user) => user.createdAt,
        direction: 'asc',
      });
      return { items: page.items.map(toPublicUser), nextCursor: page.nextCursor };
    },

    createPending: ({ name, email, passwordHash, activationHash, activationExpires }) =>
      db.write((draft) => {
        const record = buildRecord(
          { name, email, passwordHash, activationHash, activationExpires, status: 'pending' },
          { status: 'pending' },
        );
        assertEmailFree(draft, record.email);
        draft.users.push(record);
        return toUser(record);
      }),

    refreshPending: (id, { name, passwordHash, activationHash, activationExpires }) =>
      db.write((draft, tx) => {
        const record = findInDraft(draft, id);
        if (!record) {
          tx.unchanged();
          return null;
        }
        record.name = cleanName(name);
        record.passwordHash = requireHash(passwordHash);
        record.status = 'pending';
        record.activationHash = activationHash;
        record.activationExpires = iso(activationExpires);
        touch(record);
        return toUser(record);
      }),

    create: (data) =>
      db.write((draft) => {
        const record = buildRecord(data, { status: 'active' });
        assertEmailFree(draft, record.email);
        if (draft.users.some((user) => user._id === record._id))
          throw new StoreValidationError('Path `_id` is already used.');
        draft.users.push(record);
        return toUser(record);
      }),

    activate: (id) =>
      db.write((draft, tx) => {
        const record = findInDraft(draft, id);
        if (!record) {
          tx.unchanged();
          return null;
        }
        // The hash stays on purpose: using the link a second time answers 409, not "expired".
        record.status = 'active';
        delete record.activationExpires;
        touch(record);
        return toUser(record);
      }),

    updateProfile: (id, { name, avatar } = {}) =>
      db.write((draft, tx) => {
        const record = findInDraft(draft, id);
        if (!record) {
          tx.unchanged();
          return null;
        }
        if (name !== undefined) record.name = cleanName(name);
        if (avatar !== undefined) record.avatar = orDefault(avatar, DEFAULT_AVATAR);
        touch(record);
        return toUser(record);
      }),

    updateSocials: (id, fields = {}) =>
      db.write((draft, tx) => {
        const record = findInDraft(draft, id);
        if (!record) {
          tx.unchanged();
          return null;
        }
        // Only the networks that were sent change; '' clears one by storing an empty string.
        for (const key of ['facebook', 'linkedin', 'twitter'] as const) {
          const value = fields[key];
          if (value !== undefined) {
            record.socials ??= {};
            record.socials[key] = value;
          }
        }
        touch(record);
        return toUser(record);
      }),

    setResetToken: (id, hash, expires) =>
      db.write((draft, tx) => {
        const record = findInDraft(draft, id);
        if (!record) {
          tx.unchanged();
          return;
        }
        record.resetHash = hash;
        record.resetExpires = iso(expires);
        touch(record);
      }),

    consumeReset: (id, passwordHash) =>
      db.write((draft, tx) => {
        const record = findInDraft(draft, id);
        if (!record) {
          tx.unchanged();
          return null;
        }
        record.passwordHash = requireHash(passwordHash);
        // Clearing the hash makes the link single-use; passwordChangedAt ends older sessions.
        delete record.resetHash;
        delete record.resetExpires;
        record.passwordChangedAt = new Date().toISOString();
        touch(record);
        return toUser(record);
      }),

    deleteById: (id) =>
      db.write((draft, tx) => {
        const index = draft.users.findIndex((user) => user._id === id);
        if (index === -1) {
          tx.unchanged();
          return false;
        }
        draft.users.splice(index, 1);
        return true;
      }),
  };
}
