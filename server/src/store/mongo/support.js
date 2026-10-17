import mongoose from 'mongoose';
import { decodeCursor, encodeCursor } from '../../lib/pagination.js';
import { DuplicateEmailError, InvalidCursorError, StoreValidationError } from '../errors.js';

const { ObjectId } = mongoose.Types;

// Ids are hex strings outside this folder. Callers check isValidId first.
export const oid = (hex) => new ObjectId(hex);

// Marks a filter the code built itself (not user input) as safe. A no-op until the mongoose
// version that ships sanitizeFilter, where it becomes mongoose.trusted().
export const trust = (filter) => filter;

// Maps a driver or Mongoose error to the adapter-neutral errors the callers know.
export function translateError(err) {
  if (err && err.code === 11000) {
    // The unique index on email is the only one besides _id.
    return /email/.test(String(err.message)) ? new DuplicateEmailError() : new StoreValidationError('Path `_id` is already used.');
  }
  if (err && err.name === 'ValidationError') {
    const first = Object.values(err.errors ?? {})[0];
    return new StoreValidationError(first?.message ?? err.message);
  }
  return err;
}

export async function guard(promise) {
  try {
    return await promise;
  } catch (err) {
    throw translateError(err);
  }
}

// Cursor paging over (field, _id) in `direction`. Without limit and cursor everything is returned.
// One extra row is fetched to learn whether another page exists.
export async function findPage(Model, base, { cursor, limit, field, direction, select }) {
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new InvalidCursorError('limit must be a positive integer');
  }
  const sign = direction === 'desc' ? -1 : 1;
  let filter = base;
  if (cursor !== undefined && cursor !== null) {
    const after = decodeCursor(cursor);
    const key = new Date(after.key);
    if (Number.isNaN(key.getTime())) throw new InvalidCursorError();
    const op = sign === 1 ? '$gt' : '$lt';
    filter = {
      $and: [base, { $or: [{ [field]: { [op]: key } }, { [field]: key, _id: { [op]: oid(after.id) } }] }],
    };
  }
  let query = Model.find(trust(filter)).sort({ [field]: sign, _id: sign }).lean();
  if (select) query = query.select(select);
  if (limit !== undefined) query = query.limit(limit + 1);
  const rows = await query;
  if (limit === undefined || rows.length <= limit) return { rows, nextCursor: null };
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  return { rows: page, nextCursor: encodeCursor(new Date(last[field]).toISOString(), String(last._id)) };
}

// Mongo's update result: `n` before mongoose 6, `matchedCount` after.
export const matched = (result) => result.matchedCount ?? result.n ?? 0;
