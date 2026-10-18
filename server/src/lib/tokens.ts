import crypto from 'crypto';

// Opaque random tokens for emailed links. Only the SHA-256 hash is stored, so a leaked
// database row cannot be used as a link.
const hashToken = (raw: unknown): string =>
  crypto.createHash('sha256').update(String(raw)).digest('hex');

export interface NewToken {
  /** What goes into the emailed link. */
  raw: string;
  /** What is stored. */
  hash: string;
}

const newToken = (): NewToken => {
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hash: hashToken(raw) };
};

export { newToken, hashToken };
