module.exports = {
  extends: ['airbnb-base', 'prettier', 'prettier/@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  settings: {
    'import/resolver': {
      alias: {
        map: [['@src', './src']],
        extensions: ['.js', '.ts', '.tsx', '.json'],
      },
      node: {
        extensions: ['.js', '.ts', '.d.ts'],
      },
    },
  },
  rules: {
    '@typescript-eslint/restrict-plus-operands': 'error',
  },
  overrides: [
    {
      files: ['**/__tests__/*', '**/__mocks__/*'],
      env: {
        jest: true,
      },
    },
  ],
};
