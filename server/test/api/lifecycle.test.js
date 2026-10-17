import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';
import { connectDb, mongoose } from './support/db.js';

const require = createRequire(import.meta.url);
const express = require('express');
const { startServer, createShutdown } = require('../../src/lib/lifecycle');

describe('startServer', () => {
  it('does not listen until connect has resolved', async () => {
    const app = express();
    const listen = vi.spyOn(app, 'listen');
    let release;
    const connect = vi.fn(() => new Promise((resolve) => (release = resolve)));

    const starting = startServer({ app, connect, port: 0 });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(connect).toHaveBeenCalledOnce();
    expect(listen).not.toHaveBeenCalled();

    release();
    const server = await starting;
    expect(listen).toHaveBeenCalledOnce();
    expect(server.listening).toBe(true);
    await new Promise((resolve) => server.close(resolve));
  });

  it('never listens when connect fails', async () => {
    const app = express();
    const listen = vi.spyOn(app, 'listen');

    await expect(
      startServer({ app, connect: () => Promise.reject(new Error('no db')), port: 0 }),
    ).rejects.toThrow('no db');
    expect(listen).not.toHaveBeenCalled();
  });
});

describe('createShutdown', () => {
  it('closes the server, disconnects mongoose and exits 0', async () => {
    await connectDb();
    expect(mongoose.connection.readyState).toBe(1);
    const server = await startServer({ app: express(), connect: async () => {}, port: 0 });
    const exit = vi.fn();

    await createShutdown({ server, mongoose, exit })();

    expect(server.listening).toBe(false);
    expect(mongoose.connection.readyState).toBe(0);
    expect(exit).toHaveBeenCalledExactlyOnceWith(0);
  });
});
