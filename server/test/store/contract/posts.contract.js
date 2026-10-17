import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { newId } from '../../../src/lib/ids.js';
import { InvalidCursorError, StoreValidationError } from '../../../src/store/errors.js';
import { activeUser, postInput, rejection } from './support.js';

// Runs against any adapter. `makeStore()` resolves to { store, cleanup }.
export function runPostContract(label, makeStore) {
  describe(`${label}: PostRepo`, () => {
    let store;
    let cleanup;
    let alice;
    let bob;

    beforeEach(async () => {
      ({ store, cleanup } = await makeStore());
      alice = await activeUser(store, 1, { name: 'Alice' });
      bob = await activeUser(store, 2, { name: 'Bob' });
    });
    afterEach(async () => {
      await cleanup();
    });

    it('creates a post with defaults and keeps the author as an id', async () => {
      const post = await store.posts.create(postInput(alice._id));

      expect(Object.keys(post).sort()).toEqual(['_id', 'comments', 'date', 'description', 'image', 'likes', 'tag', 'title', 'user']);
      expect(post.user).toBe(alice._id);
      expect(post.image).toBe('default.jpg');
      expect(post.tag).toBe('general');
      expect(post.likes).toEqual([]);
      expect(post.comments).toEqual([]);
      expect(post.date).toBeInstanceOf(Date);
    });

    it('enforces the title and description rules', async () => {
      expect(await rejection(store.posts.create(postInput(alice._id, { title: ' ' })))).toBeInstanceOf(StoreValidationError);
      expect(await rejection(store.posts.create(postInput(alice._id, { title: 'x'.repeat(101) })))).toBeInstanceOf(StoreValidationError);
      expect(await rejection(store.posts.create(postInput(alice._id, { description: '' })))).toBeInstanceOf(StoreValidationError);
      expect((await store.posts.create(postInput(alice._id, { title: `  ${'x'.repeat(100)} ` }))).title).toHaveLength(100);
      expect((await store.admin.counts()).posts).toBe(1);
    });

    it('populates the author on find, with socials only on the detail view', async () => {
      const post = await store.posts.create(postInput(alice._id));
      await store.users.updateSocials(alice._id, { twitter: 'https://twitter.com/me' });

      const detail = await store.posts.findById(post._id);
      const list = await store.posts.list();

      expect(detail.user).toEqual({ _id: alice._id, name: 'Alice', avatar: 'default.jpg', socials: { twitter: 'https://twitter.com/me' } });
      expect(list.items[0].user).toEqual({ _id: alice._id, name: 'Alice', avatar: 'default.jpg' });
    });

    it('returns null for unknown and malformed ids', async () => {
      expect(await store.posts.findById(newId())).toBeNull();
      expect(await store.posts.findById('nope')).toBeNull();
      expect(await store.posts.update(newId(), { title: 'x' })).toBeNull();
      expect(await store.posts.getOwnerAndImage('nope')).toBeNull();
      expect(await store.posts.delete(newId())).toBeNull();
      expect(await store.posts.exists('nope')).toBe(false);
      expect(await store.posts.getComment(newId(), newId())).toBeNull();
    });

    it('shows a null author when the account is gone', async () => {
      const post = await store.posts.create(postInput(bob._id));
      await store.users.deleteById(bob._id);

      expect((await store.posts.findById(post._id)).user).toBeNull();
    });

    it('lists newest first and pages through ties on identical dates', async () => {
      const sameDate = new Date('2025-12-01T09:00:00.000Z');
      for (let n = 1; n <= 4; n += 1) {
        await store.posts.insertMany([postInput(alice._id, { title: `Tie ${n}`, date: sameDate })]);
      }
      const newest = await store.posts.create(postInput(alice._id, { title: 'Newest', date: new Date('2026-01-01T00:00:00.000Z') }));

      const everything = await store.posts.list();
      expect(everything.nextCursor).toBeNull();
      expect(everything.items[0]._id).toBe(newest._id);

      const seen = [];
      let cursor;
      let pages = 0;
      do {
        const page = await store.posts.list({ cursor, limit: 2 });
        seen.push(...page.items.map((post) => post._id));
        cursor = page.nextCursor ?? undefined;
        pages += 1;
      } while (cursor);

      expect(seen).toEqual(everything.items.map((post) => post._id));
      expect(new Set(seen).size).toBe(5);
      expect(pages).toBe(3);
      expect(await rejection(store.posts.list({ cursor: '!!!' }))).toBeInstanceOf(InvalidCursorError);
    });

    it('lists one user\'s posts', async () => {
      await store.posts.create(postInput(alice._id, { title: 'First', date: new Date('2025-12-01T00:00:00.000Z') }));
      await store.posts.create(postInput(bob._id, { title: 'Bob' }));
      await store.posts.create(postInput(alice._id, { title: 'Second', date: new Date('2025-12-02T00:00:00.000Z') }));

      const page = await store.posts.listByUser(alice._id);

      expect(page.items.map((post) => post.title)).toEqual(['Second', 'First']);
      expect(page.items[0].user).toEqual({ _id: alice._id, name: 'Alice', avatar: 'default.jpg' });
      expect((await store.posts.listByUser(newId())).items).toEqual([]);
      expect((await store.posts.listByUser('nope')).items).toEqual([]);
    });

    it('updates only the fields that were sent', async () => {
      const post = await store.posts.create(postInput(alice._id, { tag: 'travel' }));

      const updated = await store.posts.update(post._id, { title: 'Renamed', image: 'post-1.png' });

      expect(updated.title).toBe('Renamed');
      expect(updated.image).toBe('post-1.png');
      expect(updated.tag).toBe('travel');
      expect(updated.user).toBe(alice._id);
      expect(await rejection(store.posts.update(post._id, { title: '' }))).toBeInstanceOf(StoreValidationError);
      expect((await store.posts.findById(post._id)).title).toBe('Renamed');
    });

    it('gives the owner and image, deletes, and reports existence', async () => {
      const post = await store.posts.create(postInput(alice._id, { image: 'post-1.png' }));

      expect(await store.posts.getOwnerAndImage(post._id)).toEqual({ user: alice._id, image: 'post-1.png' });
      expect(await store.posts.exists(post._id)).toBe(true);
      expect(await store.posts.delete(post._id)).toEqual({ image: 'post-1.png' });
      expect(await store.posts.exists(post._id)).toBe(false);
      expect(await store.posts.delete(post._id)).toBeNull();
    });

    it('likes and unlikes, newest like first, with clear statuses', async () => {
      const post = await store.posts.create(postInput(alice._id));

      const first = await store.posts.like(post._id, alice._id);
      const second = await store.posts.like(post._id, bob._id);
      const again = await store.posts.like(post._id, bob._id);

      expect(first.status).toBe('liked');
      expect(Object.keys(first.likes[0]).sort()).toEqual(['_id', 'user']);
      expect(second.likes.map((like) => like.user)).toEqual([bob._id, alice._id]);
      expect(again).toEqual({ status: 'already' });
      expect((await store.posts.like(newId(), alice._id)).status).toBe('not-found');
      expect((await store.posts.like('nope', alice._id)).status).toBe('not-found');

      const unliked = await store.posts.unlike(post._id, bob._id);
      expect(unliked.status).toBe('unliked');
      expect(unliked.likes.map((like) => like.user)).toEqual([alice._id]);
      expect(await store.posts.unlike(post._id, bob._id)).toEqual({ status: 'not-liked' });
      expect((await store.posts.unlike(newId(), bob._id)).status).toBe('not-found');
    });

    it('keeps every like when many users like at once, and one like per user', async () => {
      const post = await store.posts.create(postInput(alice._id));
      const users = [];
      for (let n = 10; n < 30; n += 1) users.push(await activeUser(store, n));

      const results = await Promise.all(users.map((user) => store.posts.like(post._id, user._id)));
      const sameUser = await Promise.all(Array.from({ length: 5 }, () => store.posts.like(post._id, alice._id)));

      expect(results.every((result) => result.status === 'liked')).toBe(true);
      expect(sameUser.filter((result) => result.status === 'liked')).toHaveLength(1);
      expect(sameUser.filter((result) => result.status === 'already')).toHaveLength(4);
      const stored = await store.posts.findById(post._id);
      expect(stored.likes).toHaveLength(21);
      expect(new Set(stored.likes.map((like) => like.user)).size).toBe(21);
    });

    it('adds comments newest first and resolves the current name and avatar', async () => {
      const post = await store.posts.create(postInput(alice._id));

      await store.posts.addComment(post._id, alice._id, 'one');
      const comments = await store.posts.addComment(post._id, bob._id, 'two');

      expect(comments.map((comment) => comment.comment)).toEqual(['two', 'one']);
      expect(Object.keys(comments[0]).sort()).toEqual(['_id', 'avatar', 'comment', 'date', 'name', 'userId']);
      expect(comments[0]).toMatchObject({ userId: bob._id, name: 'Bob', avatar: 'default.jpg' });

      await store.users.updateProfile(bob._id, { name: 'Robert', avatar: 'user-2.png' });
      const renamed = (await store.posts.findById(post._id)).comments[0];
      expect(renamed).toMatchObject({ name: 'Robert', avatar: 'user-2.png' });

      expect(await store.posts.addComment(newId(), alice._id, 'x')).toBeNull();
      expect(await store.posts.addComment(post._id, newId(), 'x')).toBeNull();
      expect(await rejection(store.posts.addComment(post._id, alice._id, ''))).toBeInstanceOf(StoreValidationError);
    });

    it('falls back to "Deleted user" for a comment whose author is gone', async () => {
      const post = await store.posts.create(postInput(alice._id));
      await store.posts.addComment(post._id, bob._id, 'bye');
      await store.users.deleteById(bob._id);

      const [comment] = (await store.posts.findById(post._id)).comments;

      expect(comment).toMatchObject({ userId: bob._id, name: 'Deleted user', avatar: 'default.jpg' });
    });

    it('finds and removes a comment', async () => {
      const post = await store.posts.create(postInput(alice._id));
      const [comment] = await store.posts.addComment(post._id, bob._id, 'hi');

      expect(await store.posts.getComment(post._id, comment._id)).toEqual({ userId: bob._id });
      expect(await store.posts.getComment(post._id, newId())).toBeNull();
      expect(await store.posts.removeComment(post._id, newId())).toBe('comment-not-found');
      expect(await store.posts.removeComment(newId(), comment._id)).toBe('post-not-found');
      expect(await store.posts.removeComment(post._id, comment._id)).toBe('removed');
      expect((await store.posts.findById(post._id)).comments).toEqual([]);
    });

    it('imports many posts with fixed ids, likes and comments in the given order', async () => {
      const id = newId();
      const commentId = newId();
      const count = await store.posts.insertMany([
        postInput(alice._id, {
          _id: id,
          date: new Date('2025-12-01T09:00:00.000Z'),
          likes: [{ user: bob._id }, { user: alice._id }],
          comments: [{ _id: commentId, user: bob._id, comment: 'imported', date: new Date('2025-12-02T09:00:00.000Z') }],
        }),
      ]);

      const post = await store.posts.findById(id);
      expect(count).toBe(1);
      expect(post.likes.map((like) => like.user)).toEqual([bob._id, alice._id]);
      expect(post.comments[0]).toMatchObject({ _id: commentId, comment: 'imported', name: 'Bob' });
      expect(post.date.toISOString()).toBe('2025-12-01T09:00:00.000Z');
    });
  });
}
