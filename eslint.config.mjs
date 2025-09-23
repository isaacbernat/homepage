import globals from 'globals';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/', 'node_modules/', 'tests/build/fixtures/'],
  },

  js.configs.recommended,

  {
    files: ['build.js', 'aggregate_code.js', 'jest.config.js', 'tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  {
    files: ['src/script.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  {
    files: ['tests/**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },

  prettier,
];
