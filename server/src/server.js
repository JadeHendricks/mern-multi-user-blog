const app = require('./app');
const mongoose = require('mongoose');
const connectDB = require('./db');
const { startServer, createShutdown } = require('./lib/lifecycle');

const port = process.env.PORT || 5000;

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