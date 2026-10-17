// Child process for tests that expect the server to crash (KNOWN BUG B1 / B2).
// Plain node script on purpose: it is run with `node`, not through Vitest.
// Settings come from the parent's process.env (support/env.js); the port is printed as `PORT=<n>`.
import { mkdtempSync } from 'node:fs';
import path from 'node:path';
import { createApp } from '../../../src/app.js';
import { createStore } from '../../../src/store/index.js';

async function main() {
  // The editPost case needs the parent's data (the user that protect looks up), so it can point
  // CRASH_SERVER_DATA_DIR at the parent's store folder. The parent holds the folder lock, so the
  // child only reads what was already written and takes no lock itself.
  const dataDir = process.env.CRASH_SERVER_DATA_DIR;
  const store = await createStore(
    { DB_DRIVER: 'json', DATA_DIR: dataDir ?? mkdtempSync(path.join(process.env.DATA_DIR, 'crash-')), BACKUP_KEEP: 10 },
    { lock: !dataDir },
  );
  await store.init();
  const server = createApp({ store }).listen(0, '127.0.0.1', () => {
    process.stdout.write(`PORT=${server.address().port}\n`);
  });
}

main().catch((err) => {
  console.error(err.message);
  process.exit(2);
});
