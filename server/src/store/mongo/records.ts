// Converts Mongo documents (lean objects) to the stored-record shape the shared views and the
// export format use: hex string ids, repo field names for the secrets, and no empty socials.
// Dates stay Date objects in the records the views read; the export turns them into ISO strings.
import type { Types } from 'mongoose';
import { parseDate } from '../rules.js';
import type { DateValue, PostRecord, UserRecord } from '../records.js';
import type { LeanPost } from './post-model.js';
import type { LeanUser } from './user-model.js';

const USER_SECRET_COLUMNS = {
  password: 'passwordHash',
  activationToken: 'activationHash',
  activationExpires: 'activationExpires',
  resetPasswordLink: 'resetHash',
  resetPasswordExpires: 'resetExpires',
  passwordChangedAt: 'passwordChangedAt',
} as const;

// Columns that hold a secret, so queries can opt in with select('+...').
export const USER_SECRET_SELECT = Object.keys(USER_SECRET_COLUMNS)
  .map((column) => `+${column}`)
  .join(' ');

const present = <T>(value: T | null | undefined): value is T =>
  value !== undefined && value !== null;

// An id, or an author populated on read: both give the hex id.
export const idOf = (value: Types.ObjectId | { _id: Types.ObjectId }): string =>
  String('_id' in value ? value._id : value);

type SocialNetwork = 'facebook' | 'linkedin' | 'twitter';
type SocialsIn = Partial<Record<SocialNetwork, string | null | undefined>> | null | undefined;
type SocialsOut = Partial<Record<SocialNetwork, string>>;

// The networks that hold a string. Mongoose types an unset one as null, which the API never shows.
export function toSocials(raw: SocialsIn): SocialsOut | undefined {
  if (!raw) return undefined;
  const socials: SocialsOut = {};
  for (const key of ['facebook', 'linkedin', 'twitter'] as const) {
    const value = raw[key];
    if (typeof value === 'string') socials[key] = value;
  }
  return socials;
}

export const toLikeRecords = (likes: LeanPost['likes']): PostRecord['likes'] =>
  (likes ?? []).map((like) => ({ _id: String(like._id), user: String(like.user) }));

// One builder for both shapes: `date` keeps the Date (records the views read) or turns it into an
// ISO string (the export), so the two can never drift apart.
function buildUserRecord<D extends DateValue>(
  doc: LeanUser,
  date: (value: Date) => D,
): UserRecord<D> {
  const record: UserRecord<D> = {
    _id: String(doc._id),
    name: doc.name,
    email: doc.email,
    avatar: doc.avatar,
    role: doc.role,
    status: doc.status,
    createdAt: date(doc.createdAt),
    updatedAt: date(doc.updatedAt),
  };
  const socials = toSocials(doc.socials);
  if (socials && Object.keys(socials).length > 0) record.socials = socials;
  if (present(doc.password)) record.passwordHash = doc.password;
  if (present(doc.activationToken)) record.activationHash = doc.activationToken;
  if (present(doc.activationExpires)) record.activationExpires = date(doc.activationExpires);
  if (present(doc.resetPasswordLink)) record.resetHash = doc.resetPasswordLink;
  if (present(doc.resetPasswordExpires)) record.resetExpires = date(doc.resetPasswordExpires);
  if (present(doc.passwordChangedAt)) record.passwordChangedAt = date(doc.passwordChangedAt);
  return record;
}

function buildPostRecord<D extends DateValue>(
  doc: LeanPost,
  date: (value: Date) => D,
): PostRecord<D> {
  return {
    _id: String(doc._id),
    user: doc.user ? idOf(doc.user) : undefined,
    image: doc.image,
    title: doc.title,
    tag: doc.tag,
    description: doc.description,
    likes: toLikeRecords(doc.likes),
    comments: (doc.comments ?? []).map((comment) => ({
      _id: String(comment._id),
      user: idOf(comment.user),
      comment: comment.comment,
      date: date(comment.date),
    })),
    date: date(doc.date),
  };
}

const keepDate = (value: Date): Date => value;
const isoDate = (value: Date): string => value.toISOString();

export const toUserRecord = (doc: LeanUser): UserRecord<Date> => buildUserRecord(doc, keepDate);
export const toPostRecord = (doc: LeanPost): PostRecord<Date> => buildPostRecord(doc, keepDate);
export const toExportUser = (doc: LeanUser): UserRecord<string> => buildUserRecord(doc, isoDate);
export const toExportPost = (doc: LeanPost): PostRecord<string> => buildPostRecord(doc, isoDate);

// Repo field names back to Mongo columns, for import and patchUser. Dates may be Date or ISO.
const COLUMN_OF: Record<string, string> = Object.fromEntries(
  Object.entries(USER_SECRET_COLUMNS).map(([column, name]) => [name, column]),
);
const DATE_COLUMNS = new Set([
  'createdAt',
  'updatedAt',
  'passwordChangedAt',
  'activationExpires',
  'resetPasswordExpires',
]);

export const columnOf = (name: string): string => COLUMN_OF[name] ?? name;
export const toColumnValue = (column: string, value: unknown): unknown =>
  DATE_COLUMNS.has(column) ? parseDate(value) : value;

export function toUserDoc(
  record: Record<string, unknown>,
  oid: (hex: string) => Types.ObjectId,
): Record<string, unknown> {
  const doc: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null) continue;
    const column = columnOf(key);
    // assertImportable has already made sure `_id` is a valid id string.
    doc[column] =
      column === '_id' && typeof value === 'string' ? oid(value) : toColumnValue(column, value);
  }
  return doc;
}
