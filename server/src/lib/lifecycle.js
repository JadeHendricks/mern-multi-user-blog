// Start only after the database is reachable, so the API never answers requests it cannot serve.
exports.startServer = async ({ app, connect, port }) => {
    await connect();
    return new Promise((resolve, reject) => {
        const server = app.listen(port);
        server.once('listening', () => resolve(server));
        server.once('error', reject);
    });
};

// Returns a function that stops accepting connections, closes mongoose, then exits 0.
// The force-exit timer keeps a stuck keep-alive connection from hanging the process forever.
exports.createShutdown = ({ server, mongoose, exit = process.exit, forceAfterMs = 10000 }) => {
    let running;
    return () => {
        if (running) return running;
        const timer = setTimeout(() => exit(1), forceAfterMs);
        timer.unref();
        running = new Promise((resolve) => server.close(resolve))
            .then(() => mongoose.disconnect())
            .then(() => {
                clearTimeout(timer);
                exit(0);
            });
        return running;
    };
};