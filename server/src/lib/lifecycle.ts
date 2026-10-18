import type { Server } from 'node:http';
import type { Store } from '../store/types.js';

/** What startServer needs from an Express app. */
export interface Listenable {
  listen(port: number): Server;
}

// Start only after the store is ready, so the API never answers requests it cannot serve.
export const startServer = async ({
  app,
  connect,
  port,
}: {
  app: Listenable;
  connect: () => Promise<void>;
  port: number;
}): Promise<Server> => {
  await connect();
  return new Promise((resolve, reject) => {
    const server = app.listen(port);
    server.once('listening', () => {
      resolve(server);
    });
    server.once('error', reject);
  });
};

// Returns a function that stops accepting connections, closes the store (which finishes pending
// writes and releases its lock), then exits 0.
// The force-exit timer keeps a stuck keep-alive connection from hanging the process forever.
export const createShutdown = ({
  server,
  store,
  exit = (code: number) => process.exit(code),
  forceAfterMs = 10000,
}: {
  server: Pick<Server, 'close'>;
  store: Pick<Store, 'close'>;
  exit?: (code: number) => void;
  forceAfterMs?: number;
}): (() => Promise<void>) => {
  let running: Promise<void> | undefined;
  return () => {
    if (running) return running;
    const timer = setTimeout(() => {
      exit(1);
    }, forceAfterMs);
    timer.unref();
    running = new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    })
      .then(() => store.close())
      .then(() => {
        clearTimeout(timer);
        exit(0);
      });
    return running;
  };
};
