import { randomBytes } from 'node:crypto';

// Ids are 24-character lowercase hex strings everywhere outside a storage adapter. The layout is
// the familiar one (4-byte time, 5-byte random per process, 3-byte counter), so ids sort roughly
// by creation time and every adapter can map them to its own native id type.
const PROCESS_RANDOM = randomBytes(5).toString('hex');
let counter = randomBytes(3).readUIntBE(0, 3);

export function newId(): string {
  counter = (counter + 1) % 0x1000000;
  const time = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0')
    .slice(-8);
  return `${time}${PROCESS_RANDOM}${counter.toString(16).padStart(6, '0')}`;
}

const ID_PATTERN = /^[0-9a-f]{24}$/;

export const isValidId = (value: unknown): value is string =>
  typeof value === 'string' && ID_PATTERN.test(value);
