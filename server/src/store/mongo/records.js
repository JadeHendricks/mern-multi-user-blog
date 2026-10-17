// Converts Mongo documents (lean objects) to the stored-record shape the shared views and the
// export format use: hex string ids, repo field names for the secrets, and no empty socials.
// Dates stay Date objects here; toExport* turn them into ISO strings.

const USER_SECRET_COLUMNS = {
  password: 'passwordHash',
  activationToken: 'activationHash',
  activationExpires: 'activationExpires',
  resetPasswordLink: 'resetHash',
  resetPasswordExpires: 'resetExpires',
  passwordChangedAt: 'passwordChangedAt',
};

// Columns that hold a secret, so queries can opt in with select('+...').
export const USER_SECRET_SELECT = Object.keys(USER_SECRET_COLUMNS)
  .map((column) => `+${column}`)
  .join(' ');

export function toUserRecord(doc) {
  const record = {
    _id: String(doc._id),
    name: doc.name,
    email: doc.email,
    avatar: doc.avatar,
    role: doc.role,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  const socials = Object.fromEntries(Object.entries(doc.socials ?? {}).filter(([, value]) => value !== undefined));
  if (Object.keys(socials).length > 0) record.socials = socials;
  for (const [column, name] of Object.entries(USER_SECRET_COLUMNS)) {
    if (doc[column] !== undefined && doc[column] !== null) record[name] = doc[column];
  }
  return record;
}

export function toPostRecord(doc) {
  return {
    _id: String(doc._id),
    user: doc.user ? String(doc.user) : undefined,
    image: doc.image,
    title: doc.title,
    tag: doc.tag,
    description: doc.description,
    likes: (doc.likes ?? []).map((like) => ({ _id: String(like._id), user: String(like.user) })),
    comments: (doc.comments ?? []).map((comment) => ({
      _id: String(comment._id),
      user: commentAuthor(comment),
      comment: comment.comment,
      date: comment.date,
    })),
    date: doc.date,
  };
}

// Comments keep the author's id in `userId` (a string) at this point of the schema.
export const commentAuthor = (comment) => comment.userId;

const iso = (value) => new Date(value).toISOString();
const USER_DATES = ['createdAt', 'updatedAt', 'passwordChangedAt', 'activationExpires', 'resetExpires'];

export function toExportUser(record) {
  const out = { ...record };
  for (const key of USER_DATES) if (out[key] !== undefined) out[key] = iso(out[key]);
  return out;
}

export function toExportPost(record) {
  return {
    ...record,
    comments: record.comments.map((comment) => ({ ...comment, date: iso(comment.date) })),
    date: iso(record.date),
  };
}

// Repo field names back to Mongo columns, for import and patchUser. Dates may be Date or ISO.
const COLUMN_OF = Object.fromEntries(Object.entries(USER_SECRET_COLUMNS).map(([column, name]) => [name, column]));
const DATE_COLUMNS = new Set(['createdAt', 'updatedAt', 'passwordChangedAt', 'activationExpires', 'resetPasswordExpires']);

export const columnOf = (name) => COLUMN_OF[name] ?? name;
export const toColumnValue = (column, value) => (DATE_COLUMNS.has(column) ? new Date(value) : value);

export function toUserDoc(record, oid) {
  const doc = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null) continue;
    const column = columnOf(key);
    doc[column] = column === '_id' ? oid(value) : toColumnValue(column, value);
  }
  return doc;
}
