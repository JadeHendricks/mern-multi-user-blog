// Child process for tests that expect the server to crash (KNOWN BUG B1 / B2).
// Plain node script on purpose: it is run with `node`, not through Vitest.
// Config comes from the parent's NODE_CONFIG env; the port is printed as `PORT=<n>`.
import app from '../../../src/app.js';

async function main() {
  // Only the editPost case needs a database (the token check fails before any query).
  if (process.env.CRASH_SERVER_MONGO_URI) {
    const { default: mongoose } = await import('mongoose');
    await mongoose.connect(process.env.CRASH_SERVER_MONGO_URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });
  }

  const server = app.listen(0, '127.0.0.1', () => {
    process.stdout.write(`PORT=${server.address().port}\n`);
  });
}

main().catch((err) => {
  console.error(err.message);
  process.exit(2);
});
