import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

// Strict, type-aware rules apply to TypeScript only. Plain JS (e2e, *.mjs, *.cjs and the server files
// that are not converted yet) keeps the base rules, so the conversion can land file by file.
const tsFiles = ['server/**/*.ts', 'shared/**/*.ts', 'scripts/**/*.mts'];
const typeChecked = [
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
].map((config) => ({ ...config, files: tsFiles }));

export default [
  {
    ignores: [
      'node_modules/**',
      'tmp/**',
      'e2e/test-results/**',
      'playwright-report/**',
      'e2e/__screenshots__/**',
      'coverage/**',
      'server/data/**',
      '**/dist/**',
      '**/*.tsbuildinfo',
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
  {
    // Client (React 16, Vite). Classic JSX runtime: every component imports React, so
    // jsx-uses-react keeps that import from being reported as unused.
    files: ['client/**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    // Pinned: 'detect' calls context.getFilename(), which ESLint 10 removed and eslint-plugin-react 7.37 still uses.
    settings: { react: { version: '16.13' } },
    rules: {
      ...react.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // React is imported in every file and props are not typed yet.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // Existing catch blocks ignore the error on purpose; changing them would touch component code.
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
      // Existing patterns flagged by the React Compiler rules in hooks 7. Warn until the components are reworked.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
  {
    files: ['client/**/*.test.{js,jsx}', 'client/src/setupTests.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.vitest } },
  },
  {
    files: ['client/*.{js,mjs}'],
    languageOptions: { globals: { ...globals.node } },
  },
  ...typeChecked,
  {
    files: tsFiles,
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.node },
      parserOptions: {
        // projectService picks the nearest tsconfig.json for each file (server/, shared/, shared/test/).
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      // A justified exception needs `// eslint-disable-next-line ... -- <reason>`.
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 10,
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      // Express 5 accepts async handlers, so passing one to app/router methods is fine; everywhere else
      // a promise returned where a void callback is expected stays an error.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { arguments: false } },
      ],
      // Numbers in messages ("...(32)", "process 1234") are safe and read better than String(n).
      // Everything else (objects, unknown, nullable values) stays an error.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    // supertest types every response body as `any` (it is whatever the server sent), and the tests
    // assert on those bodies directly (`res.body.user.email`). The four `no-unsafe-*` rules would
    // fire on every one of those reads. They stay on for src, scripts and shared; `no-explicit-any`
    // stays on here too, so an `any` can only come from a library, never be written in a test.
    // `bodyOf<T>()` in test/api/support/helpers.ts types a body where it flows into other code.
    files: ['server/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  {
    // The repo contract (store/types.ts) is async for every adapter. The JSON adapter answers from
    // memory, but its methods stay `async` on purpose: a throw (for example "store not initialised")
    // must reach the caller as a rejected promise, never as a synchronous exception.
    files: ['server/src/store/json/**/*.ts'],
    rules: { '@typescript-eslint/require-await': 'off' },
  },
  // Keep last so it switches off every formatting rule above.
  prettier,
];
