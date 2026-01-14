import globals from 'globals';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/', 'node_modules/', 'tests/build/fixtures/'],
  },

  js.configs.recommended,

  {
    files: [
      'build.js',
      'aggregate_code.js',
      'jest.config.js',
      'playwright.config.js',
    ],
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
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        console: 'readonly',
      },
    },
  },

  {
    files: ['tests/**/*.js'],
    ignores: ['tests/e2e/**'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },

  {
    files: ['tests/accessibility/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  prettier,
];
