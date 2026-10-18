import { ConfigError, config, loadConfig } from './config.js';
import { errorMessage } from './lib/errors.js';
import type { Store } from './store/types.js';

// Validate the settings first and stop with a readable message (key names only, never values).
// The rest of the app is imported afterwards because some modules read settings at load time.
try {
  loadConfig(process.env);
} catch (err) {
  if (!(err instanceof ConfigError)) throw err;
  console.error(err.message);
  process.exit(1);
}

const { createApp } = await import('./app.js');
const { createStore } = await import('./store/index.js');
const { startServer, createShutdown } = await import('./lib/lifecycle.js');
const { createMailer } = await import('./lib/mailer.js');

let store: Store;
try {
  store = await createStore(config);
} catch (err) {
  console.error(errorMessage(err));
  process.exit(1);
}

const app = createApp({ store, mailer: createMailer(config) });

startServer({ app, connect: () => store.init(), port: config.PORT })
  .then((server) => {
    const address = server.address();
    const port = typeof address === 'object' && address !== null ? address.port : config.PORT;
    console.log(`Server running on port:${port} (${config.DB_DRIVER} store)`);
    // node --watch restarts send SIGTERM; closing the store here releases the data folder lock.
    const shutdown = createShutdown({ server, store });
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch(async (err: unknown) => {
    console.error(errorMessage(err));
    await store.close().catch(() => undefined);
    process.exit(1);
  });
