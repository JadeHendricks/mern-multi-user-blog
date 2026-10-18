import mongoose from 'mongoose';
import type { QueryFilter, Types } from 'mongoose';
import { decodeCursor, encodeCursor } from '../../lib/pagination.js';
import type { PageOptions } from '../../lib/pagination.js';
import { DuplicateEmailError, InvalidCursorError, StoreValidationError } from '../errors.js';

const { ObjectId } = mongoose.Types;

// Ids are hex strings outside this folder. Callers check isValidId first.
export const oid = (hex: string): Types.ObjectId => new ObjectId(hex);

// sanitizeFilter is on, so a query operator ({ $gt: ... }) in a filter only works when the code
// that built it marks it as trusted. User input never goes through this.
export const trust = <T>(value: T): T => mongoose.trusted(value);

// What a driver or Mongoose error looks like when it carries a code or per-field errors.
const hasCode = (err: unknown, code: number): boolean =>
  typeof err === 'object' && err !== null && 'code' in err && err.code === code;

function firstFieldMessage(err: Error): string {
  const errors: unknown = 'errors' in err ? err.errors : undefined;
  const first: unknown =
    typeof errors === 'object' && errors !== null ? Object.values(errors)[0] : undefined;
  const message =
    typeof first === 'object' && first !== null && 'message' in first ? first.message : undefined;
  return typeof message === 'string' ? message : err.message;
}

// Maps a driver or Mongoose error to the adapter-neutral errors the callers know.
export function translateError(err: unknown): unknown {
  if (hasCode(err, 11000)) {
    // The unique index on email is the only one besides _id.
    return (err instanceof Error ? err.message : '').includes('email')
      ? new DuplicateEmailError()
      : new StoreValidationError('Path `_id` is already used.');
  }
  if (err instanceof Error && err.name === 'ValidationError') {
    return new StoreValidationError(firstFieldMessage(err));
  }
  return err;
}

export async function guard<T>(promise: PromiseLike<T>): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    throw translateError(err);
  }
}

/** A lean row that can be paged: it has an id and the date column the paging sorts by. */
type Pageable<Field extends string> = { _id: Types.ObjectId } & Record<Field, Date>;

export interface PageWindowOptions<Field extends string> extends PageOptions {
  field: Field;
  direction: 'asc' | 'desc';
}

/** The parts of a cursor-paged query (see pageWindow). */
export interface PageWindow<Schema, Field extends string> {
  /** `base` narrowed to the rows after the cursor. */
  filter: QueryFilter<Schema>;
  sort: Record<string, 1 | -1>;
  /** How many rows to ask for: one more than the limit, to learn whether another page exists. */
  fetch: number | undefined;
  /** Cuts the fetched rows down to one page and makes the cursor for the next. */
  finish<Row extends Pageable<Field>>(rows: Row[]): { rows: Row[]; nextCursor: string | null };
}

// Cursor paging over (field, _id) in `direction`. Without limit and cursor everything is returned.
// The caller runs the query itself (each model has its own types) with these parts.
export function pageWindow<Schema, Field extends string>(
  base: QueryFilter<Schema>,
  { cursor, limit, field, direction }: PageWindowOptions<Field>,
): PageWindow<Schema, Field> {
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
      $and: [
        base,
        {
          $or: [
            { [field]: trust({ [op]: key }) },
            { [field]: key, _id: trust({ [op]: oid(after.id) }) },
          ],
        },
      ],
    };
  }
  return {
    filter,
    sort: { [field]: sign, _id: sign },
    fetch: limit === undefined ? undefined : limit + 1,
    finish(rows) {
      if (limit === undefined || rows.length <= limit) return { rows, nextCursor: null };
      const page = rows.slice(0, limit);
      const last = page.at(-1);
      if (last === undefined) return { rows: page, nextCursor: null };
      return {
        rows: page,
        nextCursor: encodeCursor(new Date(last[field]).toISOString(), String(last._id)),
      };
    },
  };
}

// Mongo's update result: `n` before mongoose 6, `matchedCount` after.
export const matched = (result: { matchedCount?: number; n?: number }): number =>
  result.matchedCount ?? result.n ?? 0;
