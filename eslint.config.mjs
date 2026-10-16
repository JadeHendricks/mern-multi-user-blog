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
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      // Legacy code predates these rules; warn until the refactor phases clean it up.
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
      'no-prototype-builtins': 'warn',
      'no-useless-assignment': 'warn',
      'preserve-caught-error': 'warn',
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { sourceType: 'module', globals: { ...globals.node } },
  },
  {
    // Vitest files are ES modules; crash-server.js is a plain CommonJS child script.
    files: ['test/**/*.js'],
    ignores: ['test/api/support/crash-server.js'],
    languageOptions: { sourceType: 'module', globals: { ...globals.node } },
  },
  {
    // Playwright specs pass functions to page.evaluate(), which run in the browser.
    files: ['e2e/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  prettier,
];
