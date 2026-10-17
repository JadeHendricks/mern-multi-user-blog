import { describe, expect, it } from 'vitest';
import { createAuthController } from '../../src/modules/auth/controller.js';
import { hashPassword } from '../../src/lib/password.js';

// A tiny response double: records what the controller sends.
function fakeRes() {
  const res = {
    statusCode: undefined,
    body: undefined,
    cookies: [],
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(body) {
      res.body = body;
      return res;
    },
    cookie(name) {
      res.cookies.push(name);
      return res;
    },
  };
  return res;
}

describe('login when the account disappears mid-request', () => {
  it('answers 401 like a failed login and sets no cookie', async () => {
    const passwordHash = await hashPassword('correct-horse');
    const id = 'a'.repeat(24);
    const store = {
      users: {
        // The credential check sees the account...
        findByEmail: async () => ({ _id: id, status: 'active', passwordHash }),
        // ...but it is gone by the time the profile is read (deleted in between).
        findById: async () => null,
      },
    };
    const auth = createAuthController({ store, mailer: { send: async () => undefined } });
    const res = fakeRes();

    await auth.login({ body: { email: 'gone@example.test', password: 'correct-horse' } }, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Incorrect email or password' });
    expect(res.cookies).toEqual([]);
  });
});
