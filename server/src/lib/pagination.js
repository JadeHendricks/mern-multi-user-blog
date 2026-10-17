import { InvalidCursorError } from '../store/errors.js';

// Cursor = base64url of `<sort key>|<id>`. Rows are ordered by (key, id), so rows that share a key
// (for example identical dates) still have a stable position.
const ID_AT_END = /^(.*)\|([0-9a-f]{24})$/s;

export const encodeCursor = (key, id) => Buffer.from(`${key}|${id}`, 'utf8').toString('base64url');

export function decodeCursor(cursor) {
  if (typeof cursor !== 'string' || cursor === '') throw new InvalidCursorError();
  const match = ID_AT_END.exec(Buffer.from(cursor, 'base64url').toString('utf8'));
  if (!match) throw new InvalidCursorError();
  return { key: match[1], id: match[2] };
}

// `items` must already be sorted by (key, id) in `direction`. Without limit and cursor everything
// comes back with nextCursor null. One extra row is looked at to know whether another page exists.
export function paginate(items, { cursor, limit, key, direction = 'asc' }) {
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new InvalidCursorError('limit must be a positive integer');
  }
  const sign = direction === 'desc' ? -1 : 1;
  let rows = items;
  if (cursor !== undefined && cursor !== null) {
    const after = decodeCursor(cursor);
    rows = rows.filter((item) => {
      const itemKey = key(item);
      const order = itemKey < after.key ? -1 : itemKey > after.key ? 1 : item._id < after.id ? -1 : item._id > after.id ? 1 : 0;
      return order * sign > 0;
    });
  }
  if (limit === undefined || rows.length <= limit) return { items: rows, nextCursor: null };
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  return { items: page, nextCursor: encodeCursor(key(last), last._id) };
}
