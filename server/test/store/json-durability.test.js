import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createBackups } from '../../src/store/json/backup.js';
import { migrate } from '../../src/store/json/migrations.js';
import { StoreError } from '../../src/store/errors.js';
import { activeUser, postInput, rejection } from './contract/support.js';
import { makeJsonStore } from './support.js';

const cleanups = [];
const open = async (options) => {
  const handle = await makeJsonStore(options);
  cleanups.push(handle.cleanup);
  return handle;
};
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});

const readDb = (dir) => JSON.parse(readFileSync(path.join(dir, 'db.json'), 'utf8'));
const failure = (code) => Object.assign(new Error(`simulated ${code}`), { code });

describe('json store: concurrency', () => {
  it('keeps 200 concurrent likes by different users', async () => {
    const { store, dir } = await open();
    const author = await activeUser(store, 0);
    const post = await store.posts.create(postInput(author._id));
    const users = await Promise.all(
      Array.from({ length: 200 }, (_, n) => activeUser(store, n + 1)),
    );

    const results = await Promise.all(users.map((user) => store.posts.like(post._id, user._id)));

    expect(results.every((result) => result.status === 'liked')).toBe(true);
    expect((await store.posts.findById(post._id)).likes).toHaveLength(200);
    expect(readDb(dir).posts[0].likes).toHaveLength(200);
  }, 120000);

  it('gives one liked and one already for two parallel likes by one user', async () => {
    const { store } = await open();
    const user = await activeUser(store, 1);
    const post = await store.posts.create(postInput(user._id));

    const results = await Promise.all([
      store.posts.like(post._id, user._id),
      store.posts.like(post._id, user._id),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual(['already', 'liked']);
  });

  it('never leaves invalid JSON on disk while writes are interleaved', async () => {
    const { store, dir } = await open();
    const user = await activeUser(store, 1);
    let reading = true;
    let reads = 0;
    const reader = (async () => {
      while (reading) {
        try {
          JSON.parse(await fs.readFile(path.join(dir, 'db.json'), 'utf8'));
          reads += 1;
        } catch (err) {
          // Windows can refuse a read for a moment during the rename; a parse error is the real failure.
          if (err instanceof SyntaxError) throw err;
        }
        // A polite sampler: on Windows an open reader blocks the rename (the store retries), so a
        // tight loop would only measure the retry back-off.
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    })();

    const writes = Array.from({ length: 60 }, (_, n) =>
      n % 2 === 0
        ? store.posts.create(postInput(user._id, { title: `Post ${n}` }))
        : store.users.updateProfile(user._id, { name: `Name ${n}` }),
    );
    await Promise.all(writes);
    reading = false;
    await reader;

    expect(reads).toBeGreaterThan(0);
    expect(readDb(dir).posts).toHaveLength(30);
  });
});

describe('json store: failed writes', () => {
  it('leaves memory and disk unchanged when the rename fails, then recovers', async () => {
    let fail = false;
    const rename = async (from, to) => {
      if (fail) throw failure('EIO');
      return fs.rename(from, to);
    };
    const { store, dir } = await open({ deps: { rename } });
    const user = await activeUser(store, 1);
    const post = await store.posts.create(postInput(user._id));
    const diskBefore = readFileSync(path.join(dir, 'db.json'), 'utf8');

    fail = true;
    const error = await rejection(store.posts.like(post._id, user._id));
    fail = false;

    expect(error.code).toBe('EIO');
    expect((await store.posts.findById(post._id)).likes).toEqual([]);
    expect(readFileSync(path.join(dir, 'db.json'), 'utf8')).toBe(diskBefore);
    expect(readdirSync(dir).filter((name) => name.endsWith('.tmp'))).toEqual([]);
    expect((await store.posts.like(post._id, user._id)).status).toBe('liked');
    expect(readDb(dir).posts[0].likes).toHaveLength(1);
  });

  it('keeps the queue running after a change throws', async () => {
    const { store } = await open();
    await activeUser(store, 1, { email: 'same@example.test' });

    const clash = await rejection(activeUser(store, 2, { email: 'SAME@example.test' }));
    const next = await activeUser(store, 3);

    expect(clash.name).toBe('DuplicateEmailError');
    expect(next.email).toBe('user3@example.test');
    expect((await store.admin.counts()).users).toBe(2);
  });

  it('retries a rename that Windows or OneDrive briefly refuses', async () => {
    let refusals = 0;
    const rename = async (from, to) => {
      if (refusals > 0) {
        refusals -= 1;
        throw failure('EPERM');
      }
      return fs.rename(from, to);
    };
    const { store, dir } = await open({ deps: { rename } });
    refusals = 3;

    await activeUser(store, 1);

    expect(refusals).toBe(0);
    expect(readDb(dir).users).toHaveLength(1);
  });

  it('gives up after repeated refusals and leaves the old file', async () => {
    let refuse = false;
    const rename = async (from, to) => {
      if (refuse) throw failure('EBUSY');
      return fs.rename(from, to);
    };
    const { store, dir } = await open({ deps: { rename } });
    await activeUser(store, 1);
    const before = readFileSync(path.join(dir, 'db.json'), 'utf8');

    refuse = true;
    const error = await rejection(activeUser(store, 2));
    refuse = false;

    expect(error.code).toBe('EBUSY');
    expect(readFileSync(path.join(dir, 'db.json'), 'utf8')).toBe(before);
    expect((await store.admin.counts()).users).toBe(1);
  });

  it('rejects writes after close', async () => {
    const { store } = await open();
    await store.close();

    expect(await rejection(activeUser(store, 1))).toBeInstanceOf(StoreError);
  });
});

describe('json store: startup', () => {
  it('creates db.json in a new folder and reads it back after a restart', async () => {
    const first = await open();
    const user = await activeUser(first.store, 1);
    await first.store.close();

    const second = await open({ dir: first.dir });

    expect((await second.store.users.findById(user._id)).email).toBe(user.email);
    expect(readDb(first.dir).schemaVersion).toBe(1);
  });

  it('treats an empty db.json as a new database', async () => {
    const { dir } = await open({ init: false });
    writeFileSync(path.join(dir, 'db.json'), '');

    const { store } = await open({ dir });

    expect(await store.admin.counts()).toEqual({ users: 0, posts: 0 });
  });

  it('refuses to start on a corrupt db.json and never overwrites it', async () => {
    const { dir } = await open({ init: false });
    writeFileSync(path.join(dir, 'db.json'), '{"users": [ {oops');
    mkdirSync(path.join(dir, 'backups'));
    writeFileSync(path.join(dir, 'backups', 'db-20250101T000000000Z-v1.json'), '{}');

    const attempt = await makeJsonStore({ dir, init: false });
    const error = await rejection(attempt.store.init());

    expect(error).toBeInstanceOf(StoreError);
    expect(error.message).toContain('db.json');
    expect(error.message).toContain('db-20250101T000000000Z-v1.json');
    expect(readFileSync(path.join(dir, 'db.json'), 'utf8')).toBe('{"users": [ {oops');
    // The lock was released, so a fixed file can start straight away.
    writeFileSync(path.join(dir, 'db.json'), '{"schemaVersion":1,"users":[],"posts":[]}');
    await attempt.store.init();
    expect(await attempt.store.admin.counts()).toEqual({ users: 0, posts: 0 });
    cleanups.push(attempt.cleanup);
  });

  it('removes leftover temp files', async () => {
    const { dir } = await open({ init: false });
    writeFileSync(path.join(dir, 'db.json.4242.tmp'), 'half written');

    await open({ dir });

    expect(existsSync(path.join(dir, 'db.json.4242.tmp'))).toBe(false);
  });
});

describe('json store: lock', () => {
  it('removes a stale lock and deletes its own lock on close', async () => {
    const { dir } = await open({ init: false });
    writeFileSync(path.join(dir, '.lock'), '999999');

    const { store } = await open({ dir, deps: { isAlive: () => false } });
    expect(readFileSync(path.join(dir, '.lock'), 'utf8')).toBe(String(process.pid));
    await store.close();

    expect(existsSync(path.join(dir, '.lock'))).toBe(false);
  });

  it('refuses to start while a live process holds the lock', async () => {
    const { dir } = await open({ init: false });
    writeFileSync(path.join(dir, '.lock'), '424242');

    const attempt = await makeJsonStore({ dir, init: false, deps: { isAlive: () => true } });
    const error = await rejection(attempt.store.init());

    expect(error).toBeInstanceOf(StoreError);
    expect(error.message).toContain('424242');
    expect(readFileSync(path.join(dir, '.lock'), 'utf8')).toBe('424242');
  });

  it('refuses a second store on the same folder', async () => {
    const first = await open();
    const second = await makeJsonStore({ dir: first.dir, init: false });

    expect(await rejection(second.store.init())).toBeInstanceOf(StoreError);
    // The first store still owns the lock.
    expect(existsSync(path.join(first.dir, '.lock'))).toBe(true);
  });
});

describe('json store: backups', () => {
  it('keeps exactly BACKUP_KEEP files, newest first to survive', async () => {
    const { dir } = await open({ init: false });
    const file = path.join(dir, 'db.json');
    writeFileSync(file, '{"schemaVersion":1,"users":[],"posts":[]}');
    const backups = createBackups({ dir: path.join(dir, 'backups'), keep: 3 });

    const written = [];
    for (let n = 0; n < 7; n += 1) written.push(path.basename(await backups.backupNow(file, 1)));

    const names = await backups.list();
    expect(names).toHaveLength(3);
    expect(names).toEqual(written.slice(-3));
  });

  it('backs up on every start and rotates through the store', async () => {
    const first = await open({ keep: 3 });
    await first.store.close();
    for (let n = 0; n < 5; n += 1) {
      const next = await makeJsonStore({ dir: first.dir, keep: 3 });
      await next.store.close();
    }

    expect(readdirSync(path.join(first.dir, 'backups'))).toHaveLength(3);
  });

  it('backs up at most once per interval on the write path', async () => {
    let clock = 1_000_000;
    const { store, dir } = await open({ deps: { now: () => clock } });
    const count = () =>
      existsSync(path.join(dir, 'backups')) ? readdirSync(path.join(dir, 'backups')).length : 0;
    const user = await activeUser(store, 1);
    expect(count()).toBe(0);

    clock += 11 * 60 * 1000;
    await store.users.updateProfile(user._id, { name: 'One' });
    await store.users.updateProfile(user._id, { name: 'Two' });
    expect(count()).toBe(1);

    clock += 11 * 60 * 1000;
    await store.users.updateProfile(user._id, { name: 'Three' });
    expect(count()).toBe(2);
  });
});

describe('json store: schema migrations', () => {
  it('upgrades a bare v0 file after taking a backup', async () => {
    const { dir } = await open({ init: false });
    const v0 = { users: [], posts: [] };
    writeFileSync(path.join(dir, 'db.json'), JSON.stringify(v0));

    const { store } = await open({ dir });

    expect(readDb(dir)).toEqual({ schemaVersion: 1, users: [], posts: [] });
    const backups = readdirSync(path.join(dir, 'backups')).filter((name) =>
      name.endsWith('-v0.json'),
    );
    expect(backups).toHaveLength(1);
    expect(JSON.parse(readFileSync(path.join(dir, 'backups', backups[0]), 'utf8'))).toEqual(v0);
    expect(await store.admin.counts()).toEqual({ users: 0, posts: 0 });
  });

  it('refuses a file written by a newer version and leaves it alone', async () => {
    const { dir } = await open({ init: false });
    const future = JSON.stringify({ schemaVersion: 99, users: [], posts: [] });
    writeFileSync(path.join(dir, 'db.json'), future);

    const attempt = await makeJsonStore({ dir, init: false });
    const error = await rejection(attempt.store.init());

    expect(error).toBeInstanceOf(StoreError);
    expect(error.message).toContain('99');
    expect(readFileSync(path.join(dir, 'db.json'), 'utf8')).toBe(future);
  });

  it('runs every step above the file version, in order', () => {
    const steps = [
      { to: 1, up: (data) => ({ ...data, trail: ['one'] }) },
      { to: 2, up: (data) => ({ ...data, trail: [...data.trail, 'two'] }) },
      { to: 3, up: (data) => ({ ...data, trail: [...data.trail, 'three'] }) },
    ];

    expect(migrate({ users: [], posts: [] }, steps)).toMatchObject({
      schemaVersion: 3,
      trail: ['one', 'two', 'three'],
    });
    expect(migrate({ schemaVersion: 2, trail: ['x'] }, steps)).toMatchObject({
      schemaVersion: 3,
      trail: ['x', 'three'],
    });
    expect(() => migrate({ schemaVersion: 4 }, steps)).toThrow(StoreError);
  });
});
