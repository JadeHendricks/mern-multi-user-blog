import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

// Strict, type-aware rules apply to TypeScript only. Plain JS (e2e, *.mjs, *.cjs and the server files
// that are not converted yet) keeps the base rules, so the conversion can land file by file.
const tsFiles = ['server/**/*.ts', 'shared/**/*.ts', 'scripts/**/*.ts'];
const typeChecked = [
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
].map((config) => ({ ...config, files: tsFiles }));

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
    },
  },
  // Keep last so it switches off every formatting rule above.
  prettier,
];
