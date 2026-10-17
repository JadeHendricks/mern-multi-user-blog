import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { newId } from '../../../src/lib/ids.js';
import { activeUser, hex, pendingInput, postInput, rejection } from './support.js';

// Runs against any adapter. `makeStore()` resolves to { store, cleanup }.
export function runAdminContract(label, makeStore) {
  describe(`${label}: StoreAdmin`, () => {
    let store;
    let cleanup;

    beforeEach(async () => {
      ({ store, cleanup } = await makeStore());
    });
    afterEach(async () => {
      await cleanup();
    });

    async function fill() {
      const alice = await activeUser(store, 1, { socials: { twitter: 'https://twitter.com/a' } });
      const bob = await activeUser(store, 2);
      await store.users.createPending(pendingInput(3));
      const post = await store.posts.create(postInput(alice._id, { tag: 'travel' }));
      await store.posts.like(post._id, bob._id);
      await store.posts.addComment(post._id, bob._id, 'nice');
      return { alice, bob, post };
    }

    it('counts and resets', async () => {
      await fill();
      expect(await store.admin.counts()).toEqual({ users: 3, posts: 1 });

      await store.admin.reset();

      expect(await store.admin.counts()).toEqual({ users: 0, posts: 0 });
      expect((await store.posts.list()).items).toEqual([]);
    });

    it('exports and imports without losing anything', async () => {
      const { post } = await fill();
      const exported = await store.admin.exportAll();
      const json = JSON.parse(JSON.stringify(exported));
      const second = await makeStore();

      try {
        const counts = await second.store.admin.importAll(json);

        expect(counts).toEqual({ users: 3, posts: 1 });
        expect(await second.store.admin.exportAll()).toEqual(exported);
        const imported = await second.store.posts.findById(post._id);
        expect(imported).toEqual(await store.posts.findById(post._id));
        expect((await second.store.users.listPublic()).items).toHaveLength(2);
      } finally {
        await second.cleanup();
      }
    });

    it('refuses to import over existing data unless replace is set', async () => {
      await fill();
      const exported = await store.admin.exportAll();

      expect(await rejection(store.admin.importAll(exported))).toBeInstanceOf(Error);
      expect(await store.admin.importAll(exported, { replace: true })).toEqual({
        users: 3,
        posts: 1,
      });
      expect(await rejection(store.admin.importAll({ users: [] }))).toBeInstanceOf(Error);
    });

    it('refuses an import with duplicate emails or ids', async () => {
      await fill();
      const exported = await store.admin.exportAll();
      await store.admin.reset();
      const dupEmail = structuredClone(exported);
      dupEmail.users[1].email = dupEmail.users[0].email.toUpperCase();
      const dupId = structuredClone(exported);
      dupId.users[1]._id = dupId.users[0]._id;

      expect(await rejection(store.admin.importAll(dupEmail))).toBeInstanceOf(Error);
      expect(await rejection(store.admin.importAll(dupId))).toBeInstanceOf(Error);
      expect(await store.admin.counts()).toEqual({ users: 0, posts: 0 });
    });

    it('reads the raw user with its secrets and removes absent fields', async () => {
      const user = await store.users.createPending(pendingInput(1));

      const raw = await store.admin.rawUserByEmail(user.email.toUpperCase());

      expect(raw.status).toBe('pending');
      expect(raw.passwordHash).toMatch(/^\$2/);
      expect(raw.activationHash).toMatch(/^[0-9a-f]{64}$/);
      expect(raw.activationExpires).toBeInstanceOf(Date);
      expect('resetHash' in raw).toBe(false);
      expect(await store.admin.rawUserByEmail('nobody@example.test')).toBeNull();
    });

    it('patches stored fields so tests can move time', async () => {
      const user = await store.users.createPending(pendingInput(1));
      const hash = hex();
      await store.users.setResetToken(user._id, hash, new Date(Date.now() + 60000));

      expect(
        await store.admin.patchUser(user._id, {
          resetExpires: new Date(Date.now() - 1000),
          activationExpires: null,
        }),
      ).toBe(true);

      expect(await store.users.findByResetHash(hash)).toBeNull();
      const raw = await store.admin.rawUserByEmail(user.email);
      expect('activationExpires' in raw).toBe(false);
      expect(await store.admin.patchUser(newId(), { name: 'x' })).toBe(false);
    });
  });
}
