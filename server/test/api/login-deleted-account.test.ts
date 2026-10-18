import { describe, expect, it } from 'vitest';
import { createAuthController } from '../../src/modules/auth/controller.js';
import type { AuthController } from '../../src/modules/auth/controller.js';
import { hashPassword } from '../../src/lib/password.js';
import type { User } from '../../src/store/types.js';
import { stubStore } from './support/helpers.js';

type LoginRequest = Parameters<AuthController['login']>[0];
type LoginReply = Parameters<AuthController['login']>[1];

// A tiny response double: records what the controller sends.
function fakeRes() {
  const res = {
    statusCode: undefined as number | undefined,
    body: undefined as unknown,
    cookies: [] as string[],
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
    cookie(name: string) {
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
    const store = stubStore({
      users: {
        // The credential check sees the account...
        // (Only the fields login reads exist on the stub, hence the assertion.)
        findByEmail: () => Promise.resolve({ _id: id, status: 'active', passwordHash } as User),
        // ...but it is gone by the time the profile is read (deleted in between).
        findById: () => Promise.resolve(null),
      },
    });
    const auth = createAuthController({ store, mailer: { send: () => Promise.resolve() } });
    const res = fakeRes();

    // The controller only touches `body` on the request and status/json/cookie on the response, so
    // the doubles are cast to the full Express types once, here.
    await auth.login(
      { body: { email: 'gone@example.test', password: 'correct-horse' } } as LoginRequest,
      res as unknown as LoginReply,
    );

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Incorrect email or password' });
    expect(res.cookies).toEqual([]);
  });
});
