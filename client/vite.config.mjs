import { createRequire } from 'node:module';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const require = createRequire(import.meta.url);

// The API runs on 5000. It replaces the old CRA "proxy" field. /uploads is proxied too because
// post and avatar images are served by the API, not by the client.
const api = 'http://localhost:5000';
const proxy = { '/api': api, '/uploads': api };

export default defineConfig({
  plugins: [react()],
  resolve: {
    // react-moment 0.9 is a webpack UMD bundle that require()s moment and expects moment itself.
    // Left alone, Vite picks moment's ESM build, so require() returns a namespace object and the
    // bundle crashes on load (blank page). The CommonJS build keeps the old webpack behaviour.
    alias: [{ find: /^moment$/, replacement: require.resolve('moment/moment.js') }],
  },
  // Port 3000 is fixed: AuthState.js hard-codes that origin (B14) and the Playwright baselines
  // use it. strictPort fails loudly instead of silently moving to 3001.
  server: { port: 3000, strictPort: true, proxy },
  preview: { port: 3000, strictPort: true, proxy },
  // The production server serves client/dist (see server/src/lib/paths.ts).
  build: { outDir: 'dist', emptyOutDir: true },
  test: {
    environment: 'jsdom',
    // Globals keep the ported Jest-style tests (describe/it/expect) unchanged.
    globals: true,
    setupFiles: ['./src/setupTests.js'],
  },
});
