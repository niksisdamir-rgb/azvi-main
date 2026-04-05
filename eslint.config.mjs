import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'client/dist/**'],
  },
  {
    files: ['server/**/*.ts', 'server/**/*.tsx'],
    rules: {
      'no-console': 'error',
    },
  }
);
