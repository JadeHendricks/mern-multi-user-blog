import mongoose from 'mongoose';
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

const { default: app } = await import('./app.js');
const { default: connectDB } = await import('./db.js');
const { startServer, createShutdown } = await import('./lib/lifecycle.js');

const port = config.PORT;

startServer({ app, connect: connectDB, port })
    .then((server) => {
        console.log(`Server running on port:${server.address().port}`);
        const shutdown = createShutdown({ server, mongoose });
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    })
    .catch((err) => {
        console.error(err.message);
        process.exit(1);
    });