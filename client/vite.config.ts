import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// The API runs on 5000. It replaces the old CRA "proxy" field. /uploads is proxied too because
// post and avatar images are served by the API, not by the client.
const api = 'http://localhost:5000';
const proxy = { '/api': api, '/uploads': api };

// The dev server and the tests read the shared package from its source, so a change there shows up
// without rebuilding it. A production build does not alias: it consumes shared/dist, the same
// artifact the server and `tsc -b` use.
const sharedSource = fileURLToPath(new URL('../shared/src/index.ts', import.meta.url));

export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: command === 'serve' ? { alias: { '@mern-blog/shared': sharedSource } } : {},
  // Port 3000 is fixed: the Playwright baselines use that origin. strictPort fails loudly instead
  // of silently moving to 3001.
  server: { port: 3000, strictPort: true, proxy },
  preview: { port: 3000, strictPort: true, proxy },
  // The production server serves client/dist (see server/src/lib/paths.ts).
  build: { outDir: 'dist', emptyOutDir: true },
  test: {
    environment: 'jsdom',
    // Globals keep the ported Jest-style tests (describe/it/expect) unchanged.
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
}));
