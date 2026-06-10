import js from '@eslint/js';
import globals from 'globals';

/**
 * Flat config (ESLint 9) para el backend Express.js (CommonJS / Node).
 * El frontend tiene su propia config en la raíz; esta solo cubre backend/src.
 */
export default [
  {
    ignores: ['node_modules/**', 'scripts/**', 'coverage/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off', // se migra a logger de forma incremental
      'no-process-exit': 'off',
      'prefer-const': 'warn',
      'no-var': 'error',
      eqeqeq: ['warn', 'smart'],
    },
  },
];
