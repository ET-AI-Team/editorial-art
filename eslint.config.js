import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Not type-aware on purpose: `bun run typecheck` already runs the compiler with `strict` and
 * `noUncheckedIndexedAccess`. This config catches what tsc cannot.
 */
export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', 'apps/api/prisma/migrations/**', 'out/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2022 },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
  {
    // Scripts print their reports to stdout for a person to read.
    files: ['apps/api/src/scripts/**'],
    rules: { 'no-console': 'off' },
  }
);
