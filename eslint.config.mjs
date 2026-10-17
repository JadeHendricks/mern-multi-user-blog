import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'client/**',
      'node_modules/**',
      'tmp/**',
      'e2e/test-results/**',
      'playwright-report/**',
      'e2e/__screenshots__/**',
      'coverage/**',
      'server/data/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { sourceType: 'module', globals: { ...globals.node } },
  },
  {
    // The server workspace is "type": "module": source, scripts and tests are all ES modules.
    files: ['server/**/*.js'],
    languageOptions: { sourceType: 'module', globals: { ...globals.node } },
  },
  {
    // The shared workspace is plain ES modules.
    files: ['shared/**/*.js'],
    languageOptions: { sourceType: 'module', globals: { ...globals.node } },
  },
  {
    // Playwright specs pass functions to page.evaluate(), which run in the browser.
    files: ['e2e/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  prettier,
];
