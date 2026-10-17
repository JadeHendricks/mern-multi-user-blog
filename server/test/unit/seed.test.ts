import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { verifyPassword } from '../../src/lib/password.js';
import {
  E2E_PASSWORD,
  run,
  SEED_ACTIVATION_TOKEN,
  SEED_IDS,
  SEED_IMAGES,
  seed,
} from '../../scripts/seed.js';
import { hashToken } from '../../src/lib/tokens.js';
import { freshMongoUri, stopOwnMongo } from '../support/mongo.js';
import { present } from '../store/contract/support.js';
import { makeJsonStore, makeMongoStore } from '../store/support.js';
import type { ExportData, PostView } from '../../src/store/types.js';

const tmpDirs: string[] = [];
const tmp = () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'mern-blog-seed-'));
  tmpDirs.push(dir);
  return dir;
};
afterAll(async () => {
  await stopOwnMongo();
  for (const dir of tmpDirs) rmSync(dir, { recursive: true, force: true });
});

// find and list populate the author; create and update answer a plain id.
const authorId = (post: PostView): string | undefined =>
  typeof post.user === 'object' && post.user !== null ? post.user._id : undefined;

// Bcrypt salts every hash, so those are the only fields allowed to differ between two seeds.
const stable = (data: ExportData) => ({
  ...data,
  users: data.users.map(({ passwordHash, ...rest }) => ({
    ...rest,
    hasHash: Boolean(passwordHash),
  })),
});

const io = () => {
  const lines: { out: string[]; err: string[] } = { out: [], err: [] };
  return {
    lines,
    out: (line: string) => lines.out.push(line),
    err: (line: string) => lines.err.push(line),
  };
};

describe.each([
  ['json', makeJsonStore],
  ['mongo', makeMongoStore],
])('seed() on the %s store', (_name, make) => {
  it('writes the fixed users, pending user, posts, likes and comments', async () => {
    const { store, cleanup } = await make();
    try {
      const counts = await seed(store, { images: false });

      expect(counts).toEqual({ users: 4, posts: 6, pending: 1 });
      expect(await store.admin.counts()).toEqual({ users: 5, posts: 6 });
      const first = present(await store.posts.findById(SEED_IDS.posts[0]));
      expect(authorId(first)).toBe(SEED_IDS.users.alice);
      expect(first.likes.map((like) => like.user)).toEqual([
        SEED_IDS.users.bob,
        SEED_IDS.users.carol,
        SEED_IDS.users.dan,
      ]);
      expect(first.comments).toHaveLength(2);
      expect(first.date.toISOString()).toBe('2025-12-01T09:00:00.000Z');
      expect(
        present(await store.users.findPublicById(SEED_IDS.users.alice)).createdAt.toISOString(),
      ).toBe('2025-11-20T09:00:00.000Z');
      // Images are on by default (the CLI and the E2E run); this test opted out of copying them.
      expect(SEED_IMAGES).toBe(true);
      expect(first.image).toBe('default.jpg');
    } finally {
      await cleanup();
    }
  });

  it('seeds the shared throwaway password, and a pending user with a hashed activation link', async () => {
    const { store, cleanup } = await make();
    try {
      await seed(store, { images: false });

      const alice = present(await store.users.findByEmail('alice@example.test', { secrets: true }));
      expect(await verifyPassword(E2E_PASSWORD, alice.passwordHash ?? '')).toBe(true);
      const pending = present(
        await store.users.findByActivationHash(hashToken(SEED_ACTIVATION_TOKEN)),
      );
      expect(pending.status).toBe('pending');
      expect(pending.email).toBe('erin@example.test');
      expect(await store.users.listPublic()).toMatchObject({ items: expect.any(Array) });
      expect((await store.users.listPublic()).items).toHaveLength(4);
    } finally {
      await cleanup();
    }
  });

  it('is deterministic: two fresh stores export the same data apart from password salts', async () => {
    const first = await make();
    const second = await make();
    try {
      await seed(first.store, { images: false });
      await seed(second.store, { images: false });

      expect(stable(await first.store.admin.exportAll())).toEqual(
        stable(await second.store.admin.exportAll()),
      );
    } finally {
      await first.cleanup();
      await second.cleanup();
    }
  });

  it('copies the sample images and points the users and posts at them when images are on', async () => {
    const { store, cleanup } = await make();
    const dataDir = tmp();
    try {
      await seed(store, { dataDir, images: true });

      expect(readdirSync(path.join(dataDir, 'uploads', 'users')).sort()).toEqual([
        'seed-user-1.svg',
        'seed-user-2.svg',
        'seed-user-3.svg',
        'seed-user-4.svg',
      ]);
      expect(readdirSync(path.join(dataDir, 'uploads', 'posts'))).toHaveLength(3);
      expect(present(await store.users.findPublicById(SEED_IDS.users.alice)).avatar).toBe(
        'seed-user-1.svg',
      );
      expect(present(await store.posts.findById(SEED_IDS.posts[0])).image).toBe('seed-post-1.svg');
      expect(present(await store.posts.findById(SEED_IDS.posts[3])).image).toBe('seed-post-1.svg');
    } finally {
      await cleanup();
    }
  });
});

describe('npm run seed (CLI)', () => {
  const envFor = (dir: string, extra: Record<string, string> = {}) => ({
    DB_DRIVER: 'json',
    DATA_DIR: dir,
    ...extra,
  });
  const exportOf = async (dir: string) => {
    const { createJsonStore } = await import('../../src/store/json/index.js');
    const store = createJsonStore({ DATA_DIR: dir, BACKUP_KEEP: 3 });
    await store.init();
    try {
      return stable(await store.admin.exportAll());
    } finally {
      await store.close();
    }
  };

  it('fills an empty store, refuses a non-empty one, and --reset reseeds with the same data', async () => {
    const dir = tmp();
    const first = io();
    expect(await run([], { env: envFor(dir), ...first })).toBe(0);
    expect(first.lines.out[0]).toMatch(/Seeded 4 users, 1 pending user and 6 posts/);
    const before = await exportOf(dir);

    const refused = io();
    expect(await run([], { env: envFor(dir), ...refused })).toBe(1);
    expect(refused.lines.err.join('\n')).toMatch(/--reset/);

    mkdirSync(path.join(dir, 'uploads'), { recursive: true });
    writeFileSync(path.join(dir, 'uploads', 'leftover.png'), 'x');
    const again = io();
    expect(await run(['--reset'], { env: envFor(dir), ...again })).toBe(0);

    expect(existsSync(path.join(dir, 'uploads', 'leftover.png'))).toBe(false);
    expect(await exportOf(dir)).toEqual(before);
  });

  it('seeds a Mongo store too', async () => {
    const dir = tmp();
    const result = io();

    const code = await run([], {
      env: { DB_DRIVER: 'mongo', MONGO_URI: await freshMongoUri(), DATA_DIR: dir },
      ...result,
    });

    expect(code).toBe(0);
    expect(result.lines.out[0]).toMatch(/\(mongo store\)/);
  });

  it('refuses a Mongo server that is not on this machine, without opening it or printing the address', async () => {
    const open = vi.fn();
    const result = io();
    const uri = 'mongodb+srv://someone:secret-pass@cluster0.example-host.net/blog';

    const code = await run([], {
      env: { DB_DRIVER: 'mongo', MONGO_URI: uri, DATA_DIR: tmp() },
      open,
      ...result,
    });

    expect(code).toBe(1);
    expect(open).not.toHaveBeenCalled();
    const printed = [...result.lines.out, ...result.lines.err].join('\n');
    expect(printed).not.toMatch(/example-host|secret-pass/);
  });

  it('refuses to start while another process holds the data folder', async () => {
    const dir = tmp();
    const { createJsonStore } = await import('../../src/store/json/index.js');
    const running = createJsonStore({ DATA_DIR: dir, BACKUP_KEEP: 3 });
    await running.init();
    try {
      const result = io();

      expect(await run([], { env: envFor(dir), ...result })).toBe(1);
      expect(result.lines.err.length).toBeGreaterThan(0);
      expect((await running.admin.counts()).users).toBe(0);
    } finally {
      await running.close();
    }
  });
});
