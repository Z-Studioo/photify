module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: true,
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],

    // General rules
    'no-console': 'off', // Allow console statements in server for logging
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    'no-undef': 'off', // TypeScript handles this
    'no-unused-vars': 'off', // Use TypeScript version instead
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
  overrides: [
    {
      files: ['*.test.ts', '*.spec.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
