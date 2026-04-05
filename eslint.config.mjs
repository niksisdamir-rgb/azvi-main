import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', 'client/dist/**', '*.js', '*.cjs', '*.mjs', 'patch_consoles.js'],
  },
  {
    files: ['server/**/*.ts', 'server/**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);
