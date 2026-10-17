import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/lib/password.js';

// Hash made with bcryptjs 2.4.3 (cost 12) for a throwaway password, before the bcryptjs 3 upgrade.
// Accounts created before the upgrade must keep logging in.
const LEGACY_HASH = '$2a$12$0LxwddjM.tn0o0AUrMbObuIpJfOWFz3LKY7/agcW.95aA2FJIG0ja';
const LEGACY_PASSWORD = 'compat-check-password';

describe('password hashes', () => {
  it('still verifies a $2a$ hash made by bcryptjs 2.4.3', async () => {
    expect(await verifyPassword(LEGACY_PASSWORD, LEGACY_HASH)).toBe(true);
    expect(await verifyPassword('not-the-password', LEGACY_HASH)).toBe(false);
  });

  it('hashes new passwords at cost 12 and verifies them', async () => {
    const hash = await hashPassword('a-fresh-password');
    expect(hash).toMatch(/^\$2b\$12\$/);
    expect(await verifyPassword('a-fresh-password', hash)).toBe(true);
    expect(await verifyPassword('another-password', hash)).toBe(false);
  });
});
