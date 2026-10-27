const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const importX = require('eslint-plugin-import-x');
const prettier = require('eslint-config-prettier');
const globals = require('globals');

// Type-aware linting (parserOptions.projectService) is intentionally not enabled: the TypeScript project
// pulls in the very large JSON mock data under src/mocks and the linter runs out of memory.
module.exports = tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.yalc/**',
      '.sf/**',
      'dist/**',
      'coverage/**',
      'db/**',
      'support/**',
      'src/mocks/**',
      'logs/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.ts', '.d.ts'],
        },
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-empty-object-type': ['error', { allowObjectTypes: 'always' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'none', varsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true },
      ],
      'import-x/extensions': 'off',
      'import-x/no-named-as-default-member': 'off',
      'import-x/no-named-as-default': 'off',
    },
  },
  {
    files: ['**/__tests__/*', '**/__mocks__/*', 'src/utils/jestSetup.ts', 'src/utils/jestGlobal.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  prettier,
);
