import { MAX_LIMIT } from '@mern-blog/shared';
import { z } from 'zod';
import { InvalidCursorError } from './errors.js';

// Cursor = base64url of `<sort key>|<id>`. Rows are ordered by (key, id), so rows that share a key
// (for example identical dates) still have a stable position.
const ID_AT_END = /^(.*)\|([0-9a-f]{24})$/s;

export interface DecodedCursor {
  key: string;
  id: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/** `cursor` and `limit` as the repos take them. Without a limit and a cursor everything is returned. */
export interface PageOptions {
  cursor?: string | null | undefined;
  limit?: number | undefined;
}

export const encodeCursor = (key: string, id: string): string =>
  Buffer.from(`${key}|${id}`, 'utf8').toString('base64url');

export function decodeCursor(cursor: unknown): DecodedCursor {
  if (typeof cursor !== 'string' || cursor === '') throw new InvalidCursorError();
  const match = ID_AT_END.exec(Buffer.from(cursor, 'base64url').toString('utf8'));
  const [, key, id] = match ?? [];
  if (key === undefined || id === undefined) throw new InvalidCursorError();
  return { key, id };
}

export interface PaginateOptions<T> extends PageOptions {
  /** The value rows are ordered by (before the id tie-break). */
  key: (item: T) => string;
  direction?: 'asc' | 'desc';
}

// `items` must already be sorted by (key, id) in `direction`. Without limit and cursor everything
// comes back with nextCursor null. One extra row is looked at to know whether another page exists.
export function paginate<T extends { _id: string }>(
  items: readonly T[],
  { cursor, limit, key, direction = 'asc' }: PaginateOptions<T>,
): Page<T> {
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new InvalidCursorError('limit must be a positive integer');
  }
  const sign = direction === 'desc' ? -1 : 1;
  let rows = items;
  if (cursor !== undefined && cursor !== null) {
    const after = decodeCursor(cursor);
    rows = rows.filter((item) => {
      const itemKey = key(item);
      const order =
        itemKey < after.key
          ? -1
          : itemKey > after.key
            ? 1
            : item._id < after.id
              ? -1
              : item._id > after.id
                ? 1
                : 0;
      return order * sign > 0;
    });
  }
  // rows[limit - 1] only exists when there are at least `limit` rows; with more than `limit` it is
  // the last row of the page.
  const last = limit === undefined ? undefined : rows[limit - 1];
  if (limit === undefined || last === undefined || rows.length <= limit) {
    return { items: [...rows], nextCursor: null };
  }
  return { items: rows.slice(0, limit), nextCursor: encodeCursor(key(last), last._id) };
}

// ?cursor=&limit= for the list endpoints. Both are optional; a bad value raises InvalidCursorError,
// which the error handler answers with 422. Repeated params (?limit=1&limit=2) are rejected too.
const pageQuery = z.object({
  cursor: z.string().min(1).optional(),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(MAX_LIMIT))
    .optional(),
});

export function parsePageQuery(query: { cursor?: unknown; limit?: unknown }): PageOptions {
  const result = pageQuery.safeParse({ cursor: query.cursor, limit: query.limit });
  if (!result.success)
    throw new InvalidCursorError('cursor must be a string and limit a whole number from 1 to 100');
  // A malformed cursor is caught here too, so the answer does not depend on the driver.
  if (result.data.cursor !== undefined) decodeCursor(result.data.cursor);
  return result.data;
}
