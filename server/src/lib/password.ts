import bcrypt from 'bcryptjs';

// Hashing lives here, not in a storage adapter, so every adapter stores the same `passwordHash`.
// The inputs are unknown on purpose: whatever a request body holds is turned into text first, as it
// always was.
const COST = 12;

export const hashPassword = (password: unknown): Promise<string> =>
  bcrypt.hash(String(password), COST);

export const verifyPassword = (candidate: unknown, hash: string): Promise<boolean> =>
  bcrypt.compare(String(candidate), hash);
