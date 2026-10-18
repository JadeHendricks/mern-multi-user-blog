import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { run as exportRun } from '../../scripts/db-export.js';
import { run as importRun } from '../../scripts/db-import.js';
import { run as seedRun } from '../../scripts/seed.js';
import { isLocalMongoUri } from '../../src/lib/mongo-uri.js';
import { freshMongoUri, stopOwnMongo } from '../support/mongo.js';

const tmpDirs = [];
const tmp = () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'mern-blog-dbscripts-'));
  tmpDirs.push(dir);
  return dir;
};
afterAll(async () => {
  await stopOwnMongo();
  for (const dir of tmpDirs) rmSync(dir, { recursive: true, force: true });
});

const io = () => {
  const lines = { out: [], err: [] };
  return { lines, out: (line) => lines.out.push(line), err: (line) => lines.err.push(line), text: () => [...lines.out, ...lines.err].join('\n') };
};
const jsonEnv = (dir) => ({ DB_DRIVER: 'json', DATA_DIR: dir });
const mongoEnv = async (dir) => ({ DB_DRIVER: 'mongo', MONGO_URI: await freshMongoUri(), DATA_DIR: dir });
const readExport = (file) => JSON.parse(readFileSync(file, 'utf8'));
const byId = (list) => [...list].sort((a, b) => (a._id < b._id ? -1 : 1));
// What an export file says about the data (not when it was written).
const content = (file) => {
  const { users, posts, schemaVersion } = readExport(file);
  return { schemaVersion, users: byId(users), posts: byId(posts) };
};

async function seededJson() {
  const dir = tmp();
  expect(await seedRun([], { env: jsonEnv(dir), ...io() })).toBe(0);
  return dir;
}

async function exportTo(env, file) {
  const result = io();
  expect(await exportRun([file], { env, ...result })).toBe(0);
  return result;
}

describe('isLocalMongoUri', () => {
  it.each([
    'mongodb://localhost:27017/blog',
    'mongodb://127.0.0.1/blog',
    'mongodb://[::1]:27017/blog',
    'mongodb://user:pass@localhost:27017/blog?authSource=admin',
    'mongodb://localhost:27017,127.0.0.1:27018/blog',
    'MONGODB://LOCALHOST/blog',
  ])('accepts %s', (uri) => {
    expect(isLocalMongoUri(uri)).toBe(true);
  });

  it.each([
    'mongodb+srv://cluster0.example.net/blog',
    'mongodb+srv://localhost/blog',
    'mongodb://db.example.net:27017/blog',
    'mongodb://localhost:27017,db.example.net:27017/blog',
    // Credentials that look local do not make the host local.
    'mongodb://localhost:pass@db.example.net/blog',
    'mongodb://user:p@ss@db.example.net/blog',
    'mongodb://localhost.example.net/blog',
    'http://localhost/blog',
    '',
    undefined,
  ])('refuses %s', (uri) => {
    expect(isLocalMongoUri(uri)).toBe(false);
  });
});

describe('npm run db:export', () => {
  it('writes the whole store to a file with the format envelope and warns that it is sensitive', async () => {
    const dir = await seededJson();
    const file = path.join(tmp(), 'out.json');

    const result = await exportTo(jsonEnv(dir), file);

    const data = readExport(file);
    expect(data).toMatchObject({ format: 'mern-blog-export', version: 1 });
    expect(Number.isNaN(Date.parse(data.exportedAt))).toBe(false);
    expect(data.users).toHaveLength(5);
    expect(data.posts).toHaveLength(6);
    expect(data.users[0].passwordHash).toMatch(/^\$2/);
    expect(result.lines.out.join('\n')).toMatch(/password hashes/);
    // The hashes are in the file, never on the terminal.
    expect(result.text()).not.toContain(data.users[0].passwordHash);
  });

  it('defaults to DATA_DIR/exports and never overwrites an earlier file', async () => {
    const dir = await seededJson();
    const now = () => new Date('2026-02-03T04:05:06.000Z');

    expect(await exportRun([], { env: jsonEnv(dir), now, ...io() })).toBe(0);
    expect(readdirSync(path.join(dir, 'exports'))).toEqual(['export-20260203T040506Z.json']);
    const again = io();
    expect(await exportRun([], { env: jsonEnv(dir), now, ...again })).toBe(1);
    expect(again.lines.err.length).toBeGreaterThan(0);
  });
});

describe('npm run db:import', () => {
  it('round-trips json -> file -> json', async () => {
    const source = await seededJson();
    const file = path.join(tmp(), 'a.json');
    await exportTo(jsonEnv(source), file);
    const target = tmp();

    expect(await importRun([file], { env: jsonEnv(target), ...io() })).toBe(0);

    const back = path.join(tmp(), 'b.json');
    await exportTo(jsonEnv(target), back);
    expect(content(back)).toEqual(content(file));
  });

  it('round-trips json -> mongo -> json', async () => {
    const source = await seededJson();
    const first = path.join(tmp(), 'first.json');
    await exportTo(jsonEnv(source), first);
    const mongo = await mongoEnv(tmp());

    const imported = io();
    expect(await importRun([first], { env: mongo, ...imported })).toBe(0);
    expect(imported.lines.out[0]).toMatch(/Imported 5 users and 6 posts into the mongo store/);

    const fromMongo = path.join(tmp(), 'from-mongo.json');
    await exportTo(mongo, fromMongo);
    expect(content(fromMongo)).toEqual(content(first));

    const last = tmp();
    expect(await importRun([fromMongo], { env: jsonEnv(last), ...io() })).toBe(0);
    const finalFile = path.join(tmp(), 'final.json');
    await exportTo(jsonEnv(last), finalFile);
    expect(content(finalFile)).toEqual(content(first));
  });

  it('refuses a non-empty store unless --replace is given', async () => {
    const dir = await seededJson();
    const file = path.join(tmp(), 'a.json');
    await exportTo(jsonEnv(dir), file);

    const refused = io();
    expect(await importRun([file], { env: jsonEnv(dir), ...refused })).toBe(1);
    expect(refused.text()).toMatch(/not empty/);

    expect(await importRun([file, '--replace'], { env: jsonEnv(dir), ...io() })).toBe(0);
    // The JSON store copied db.json aside when it opened, before the replace.
    expect(readdirSync(path.join(dir, 'backups')).length).toBeGreaterThan(0);
  });

  it('validates the file and says where it is wrong without echoing values', async () => {
    const dir = await seededJson();
    const good = path.join(tmp(), 'good.json');
    await exportTo(jsonEnv(dir), good);
    const data = readExport(good);
    data.users[0].role = 'superuser-value-that-must-not-be-echoed';
    data.posts[0]._id = 'not-an-id';
    const bad = path.join(tmp(), 'bad.json');
    writeFileSync(bad, JSON.stringify(data));
    const target = tmp();

    const result = io();
    expect(await importRun([bad], { env: jsonEnv(target), ...result })).toBe(1);

    expect(result.text()).toMatch(/users\.0\.role/);
    expect(result.text()).toMatch(/posts\.0\._id/);
    expect(result.text()).not.toMatch(/must-not-be-echoed/);
    // Nothing was opened, so nothing was created.
    expect(existsSync(path.join(target, 'db.json'))).toBe(false);
  });

  it('rejects a missing file, invalid JSON, a wrong format and a missing argument', async () => {
    const target = tmp();
    const notJson = path.join(tmp(), 'not.json');
    writeFileSync(notJson, '{ nope');
    const wrongFormat = path.join(tmp(), 'wrong.json');
    writeFileSync(wrongFormat, JSON.stringify({ users: [], posts: [] }));

    for (const args of [[path.join(tmp(), 'missing.json')], [notJson], [wrongFormat], []]) {
      const result = io();
      expect(await importRun(args, { env: jsonEnv(target), ...result })).toBe(1);
      expect(result.lines.err.length).toBeGreaterThan(0);
    }
  });

  it('refuses a duplicate email even in a valid file', async () => {
    const dir = await seededJson();
    const good = path.join(tmp(), 'good.json');
    await exportTo(jsonEnv(dir), good);
    const data = readExport(good);
    data.users[1].email = data.users[0].email.toUpperCase();
    const bad = path.join(tmp(), 'dup.json');
    writeFileSync(bad, JSON.stringify(data));

    const result = io();
    expect(await importRun([bad], { env: jsonEnv(tmp()), ...result })).toBe(1);
    expect(result.text()).toMatch(/same email/);
  });

  describe('non-local Mongo URIs', () => {
    const secretHost = 'cluster0.private-example.net';
    const file = async () => {
      const dir = await seededJson();
      const out = path.join(tmp(), 'a.json');
      await exportTo(jsonEnv(dir), out);
      return out;
    };

    it.each([
      ['an srv address', `mongodb+srv://admin:hunter2@${secretHost}/blog`],
      ['a remote host', `mongodb://${secretHost}:27017/blog`],
      ['credentials that only look local', `mongodb://localhost:hunter2@${secretHost}/blog`],
    ])('refuses %s without opening the store or printing the URI', async (_label, uri) => {
      const open = vi.fn();
      const result = io();

      const code = await importRun([await file()], { env: { DB_DRIVER: 'mongo', MONGO_URI: uri, DATA_DIR: tmp() }, open, ...result });

      expect(code).toBe(1);
      expect(open).not.toHaveBeenCalled();
      expect(result.text()).toMatch(/--allow-remote/);
      expect(result.text()).not.toMatch(/private-example|hunter2/);
    });

    it('goes ahead with --allow-remote, using a stand-in store and never printing the URI', async () => {
      const store = {
        admin: { importAll: vi.fn().mockResolvedValue({ users: 5, posts: 6 }) },
        close: vi.fn().mockResolvedValue(undefined),
      };
      const open = vi.fn().mockResolvedValue(store);
      const result = io();

      const code = await importRun([await file(), '--allow-remote'], {
        env: { DB_DRIVER: 'mongo', MONGO_URI: `mongodb+srv://admin:hunter2@${secretHost}/blog`, DATA_DIR: tmp() },
        open,
        ...result,
      });

      expect(code).toBe(0);
      expect(open).toHaveBeenCalledTimes(1);
      expect(store.admin.importAll).toHaveBeenCalledTimes(1);
      expect(store.close).toHaveBeenCalled();
      expect(result.text()).not.toMatch(/private-example|hunter2/);
    });

    it('hides a connection string that a driver error quotes', async () => {
      const uri = `mongodb://localhost:27017/blog`;
      const open = vi.fn().mockRejectedValue(new Error(`getaddrinfo failed for mongodb+srv://admin:hunter2@${secretHost}/blog`));
      const result = io();

      const code = await importRun([await file()], { env: { DB_DRIVER: 'mongo', MONGO_URI: uri, DATA_DIR: tmp() }, open, ...result });

      expect(code).toBe(1);
      expect(result.text()).not.toMatch(/private-example|hunter2/);
      expect(result.text()).toMatch(/mongo uri hidden/);
    });
  });
});
