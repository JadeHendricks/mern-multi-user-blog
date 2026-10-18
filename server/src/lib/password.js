import bcrypt from 'bcryptjs';

// Hashing lives here, not in a storage adapter, so every adapter stores the same `passwordHash`.
const COST = 12;

export const hashPassword = (password) => bcrypt.hash(String(password), COST);

export const verifyPassword = (candidate, hash) => bcrypt.compare(String(candidate), hash);
