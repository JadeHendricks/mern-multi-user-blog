import express from 'express';
import { describe, expect, it, vi } from 'vitest';

import { createShutdown, startServer } from '../../src/lib/lifecycle.js';

describe('startServer', () => {
  it('does not listen until connect has resolved', async () => {
    const app = express();
    const listen = vi.spyOn(app, 'listen');
    let release: () => void = () => undefined;
    const connect = vi.fn(() => new Promise<void>((resolve) => (release = resolve)));

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
  it('closes the server, closes the store and exits 0', async () => {
    const store = { close: vi.fn(() => Promise.resolve()) };
    const server = await startServer({ app: express(), connect: () => Promise.resolve(), port: 0 });
    const exit = vi.fn();

    await createShutdown({ server, store, exit })();

    expect(server.listening).toBe(false);
    expect(store.close).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledExactlyOnceWith(0);
  });
});
