import { ConfigError, config, loadConfig } from './config.js';

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

let store;
try {
    store = await createStore(config);
} catch (err) {
    console.error(err.message);
    process.exit(1);
}
const app = createApp({ store });

startServer({ app, connect: () => store.init(), port: config.PORT })
    .then((server) => {
        console.log(`Server running on port:${server.address().port} (${config.DB_DRIVER} store)`);
        // node --watch restarts send SIGTERM; closing the store here releases the data folder lock.
        const shutdown = createShutdown({ server, store });
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    })
    .catch(async (err) => {
        console.error(err.message);
        await store.close().catch(() => {});
        process.exit(1);
    });
