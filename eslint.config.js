// @ts-check
import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.js'],
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-duplicate-imports': 'error',
      'no-constant-binary-expression': 'error',
      'no-promise-executor-return': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unreachable-loop': 'error',
      'require-atomic-updates': 'error',
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/indent': ['error', 2],
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
];