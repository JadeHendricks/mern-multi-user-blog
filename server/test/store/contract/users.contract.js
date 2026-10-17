import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { newId } from '../../../src/lib/ids.js';
import { DuplicateEmailError, InvalidCursorError, StoreValidationError } from '../../../src/store/errors.js';
import { activeUser, hex, pendingInput, rejection } from './support.js';

// Runs against any adapter. `makeStore()` resolves to { store, cleanup }.
export function runUserContract(label, makeStore) {
  describe(`${label}: UserRepo`, () => {
    let store;
    let cleanup;

    beforeEach(async () => {
      ({ store, cleanup } = await makeStore());
    });
    afterEach(async () => {
      await cleanup();
    });

    it('creates a pending user and finds it by id and by email (trimmed, any case)', async () => {
      const created = await store.users.createPending(pendingInput(1, { email: '  Mixed.Case@Example.Test ' }));

      expect(created.status).toBe('pending');
      expect(created.email).toBe('mixed.case@example.test');
      expect(created.role).toBe('user');
      expect(created.avatar).toBe('default.jpg');
      expect(created.createdAt).toBeInstanceOf(Date);
      expect((await store.users.findById(created._id))._id).toBe(created._id);
      expect((await store.users.findByEmail('MIXED.case@example.test '))._id).toBe(created._id);
    });

    it('returns null for unknown and malformed ids and emails', async () => {
      expect(await store.users.findById(newId())).toBeNull();
      expect(await store.users.findById('not-an-id')).toBeNull();
      expect(await store.users.findById(undefined)).toBeNull();
      expect(await store.users.findByEmail('nobody@example.test')).toBeNull();
      expect(await store.users.findPublicById('not-an-id')).toBeNull();
      expect(await store.users.activate(newId())).toBeNull();
      expect(await store.users.updateProfile('not-an-id', { name: 'x' })).toBeNull();
      expect(await store.users.updateSocials(newId(), { twitter: 'https://x.test' })).toBeNull();
      expect(await store.users.deleteById(newId())).toBe(false);
    });

    it('returns secrets only when asked', async () => {
      const created = await store.users.createPending(pendingInput(1));

      const plain = await store.users.findById(created._id);
      const secret = await store.users.findById(created._id, { secrets: true });
      const byEmail = await store.users.findByEmail(created.email, { secrets: true });

      for (const key of ['passwordHash', 'activationHash', 'activationExpires', 'resetHash', 'resetExpires', 'passwordChangedAt']) {
        expect(key in plain).toBe(false);
      }
      expect(secret.passwordHash).toMatch(/^\$2a\$12\$/);
      expect(secret.activationHash).toMatch(/^[0-9a-f]{64}$/);
      expect(byEmail.passwordHash).toBe(secret.passwordHash);
    });

    it('rejects a duplicate email in any case, and only one of two concurrent creates wins', async () => {
      await store.users.createPending(pendingInput(1, { email: 'a@x.test' }));

      const clash = await rejection(store.users.createPending(pendingInput(2, { email: 'A@X.test' })));
      expect(clash).toBeInstanceOf(DuplicateEmailError);

      const results = await Promise.allSettled([
        store.users.createPending(pendingInput(3, { email: 'race@x.test' })),
        store.users.createPending(pendingInput(4, { email: 'RACE@x.test' })),
      ]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(results.find((r) => r.status === 'rejected').reason).toBeInstanceOf(DuplicateEmailError);
      expect(await store.users.create({ name: 'Other', email: 'a@x.test', passwordHash: hex() }).catch((e) => e)).toBeInstanceOf(
        DuplicateEmailError,
      );
    });

    it('enforces the name rules', async () => {
      expect(await rejection(store.users.createPending(pendingInput(1, { name: '   ' })))).toBeInstanceOf(StoreValidationError);
      expect(await rejection(store.users.createPending(pendingInput(2, { name: 'x'.repeat(33) })))).toBeInstanceOf(StoreValidationError);
      expect((await store.users.createPending(pendingInput(3, { name: `  ${'x'.repeat(32)}  ` }))).name).toBe('x'.repeat(32));
    });

    it('finds by activation hash with its expiry, and activation keeps the hash', async () => {
      const input = pendingInput(1);
      const created = await store.users.createPending(input);

      const found = await store.users.findByActivationHash(input.activationHash);
      expect(found._id).toBe(created._id);
      expect(found.activationExpires.getTime()).toBe(input.activationExpires.getTime());
      expect(await store.users.findByActivationHash(hex())).toBeNull();

      const activated = await store.users.activate(created._id);
      expect(activated.status).toBe('active');
      const again = await store.users.findByActivationHash(input.activationHash);
      expect(again.status).toBe('active');
      expect(again.activationExpires).toBeUndefined();
    });

    it('refreshes a pending signup with a new name, password and link', async () => {
      const first = pendingInput(1);
      const created = await store.users.createPending(first);
      const next = { name: 'New Name', passwordHash: `$2a$12$${hex(40)}`, activationHash: hex(), activationExpires: new Date(Date.now() + 5000) };

      const refreshed = await store.users.refreshPending(created._id, next);

      expect(refreshed.name).toBe('New Name');
      expect(refreshed.status).toBe('pending');
      expect(await store.users.findByActivationHash(first.activationHash)).toBeNull();
      expect((await store.users.findByActivationHash(next.activationHash))._id).toBe(created._id);
      expect((await store.users.findById(created._id, { secrets: true })).passwordHash).toBe(next.passwordHash);
      expect(await store.users.refreshPending(newId(), next)).toBeNull();
    });

    it('hides pending users from the public views and lists', async () => {
      const pending = await store.users.createPending(pendingInput(1));
      const active = await activeUser(store, 2);

      expect(await store.users.findPublicById(pending._id)).toBeNull();
      const publicView = await store.users.findPublicById(active._id);
      expect(Object.keys(publicView).sort()).toEqual(['_id', 'avatar', 'createdAt', 'name']);
      const page = await store.users.listPublic();
      expect(page.items.map((user) => user._id)).toEqual([active._id]);
      expect(page.nextCursor).toBeNull();

      await store.users.activate(pending._id);
      expect((await store.users.listPublic()).items).toHaveLength(2);
    });

    it('pages the public list by (createdAt, _id), including ties, and rejects bad cursors', async () => {
      const createdAt = new Date('2025-11-20T09:00:00.000Z');
      const ids = [];
      for (let n = 1; n <= 5; n += 1) {
        // The last two share a timestamp with the first three on purpose.
        ids.push((await activeUser(store, n, { createdAt: n <= 3 ? createdAt : new Date('2025-11-21T09:00:00.000Z') }))._id);
      }
      const expected = [...ids.slice(0, 3).sort(), ...ids.slice(3).sort()];

      const seen = [];
      let cursor;
      let pages = 0;
      do {
        const page = await store.users.listPublic({ cursor, limit: 2 });
        seen.push(...page.items.map((user) => user._id));
        cursor = page.nextCursor ?? undefined;
        pages += 1;
      } while (cursor);

      expect(seen).toEqual(expected);
      expect(pages).toBe(3);
      expect(await rejection(store.users.listPublic({ cursor: 'not a cursor' }))).toBeInstanceOf(InvalidCursorError);
      expect(await rejection(store.users.listPublic({ limit: 0 }))).toBeInstanceOf(InvalidCursorError);
    });

    it('updates the profile without creating anything', async () => {
      const user = await activeUser(store, 1);

      const updated = await store.users.updateProfile(user._id, { name: '  Renamed ', avatar: 'user-1.png' });

      expect(updated.name).toBe('Renamed');
      expect(updated.avatar).toBe('user-1.png');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(user.updatedAt.getTime());
      expect((await store.users.updateProfile(user._id, {})).name).toBe('Renamed');
      expect(await store.users.updateProfile(newId(), { name: 'Ghost' })).toBeNull();
      expect((await store.admin.counts()).users).toBe(1);
    });

    it('sets only the socials that were sent, and "" clears one', async () => {
      const user = await activeUser(store, 1);
      expect('socials' in (await store.users.findById(user._id))).toBe(false);

      await store.users.updateSocials(user._id, { facebook: 'https://facebook.com/me', twitter: 'https://twitter.com/me' });
      const second = await store.users.updateSocials(user._id, { twitter: '' });

      expect(second.socials).toEqual({ facebook: 'https://facebook.com/me', twitter: '' });
      expect((await store.users.findPublicById(user._id)).socials).toEqual(second.socials);
    });

    it('resets a password once, ends old sessions and ignores expired links', async () => {
      const user = await activeUser(store, 1);
      const hash = hex();
      await store.users.setResetToken(user._id, hash, new Date(Date.now() + 30 * 60 * 1000));

      expect((await store.users.findByResetHash(hash))._id).toBe(user._id);
      expect(await store.users.findByResetHash(hex())).toBeNull();

      const newHash = `$2a$12$${hex(40)}`;
      await store.users.consumeReset(user._id, newHash);
      const after = await store.users.findById(user._id, { secrets: true });
      expect(after.passwordHash).toBe(newHash);
      expect(after.passwordChangedAt).toBeInstanceOf(Date);
      expect('resetHash' in after).toBe(false);
      expect('resetExpires' in after).toBe(false);
      expect(await store.users.findByResetHash(hash)).toBeNull();

      await store.users.setResetToken(user._id, hash, new Date(Date.now() - 1000));
      expect(await store.users.findByResetHash(hash)).toBeNull();
      expect(await store.users.consumeReset(newId(), newHash)).toBeNull();
    });

    it('deletes a user', async () => {
      const user = await activeUser(store, 1);

      expect(await store.users.deleteById(user._id)).toBe(true);
      expect(await store.users.findById(user._id)).toBeNull();
      expect(await store.users.findByEmail(user.email)).toBeNull();
    });

    it('creates users with fixed ids and dates for seed and import', async () => {
      const id = newId();
      const created = await activeUser(store, 1, { _id: id, createdAt: new Date('2025-11-20T09:00:00.000Z'), socials: { twitter: 'https://twitter.com/me' } });

      expect(created._id).toBe(id);
      expect(created.status).toBe('active');
      expect(created.createdAt.toISOString()).toBe('2025-11-20T09:00:00.000Z');
      expect(created.socials).toEqual({ twitter: 'https://twitter.com/me' });
      expect(await rejection(activeUser(store, 2, { _id: 'nope' }))).toBeInstanceOf(StoreValidationError);
    });
  });
}
