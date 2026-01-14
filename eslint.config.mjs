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
        ...globals.jest,
        console: 'readonly',
      },
    },
  },

  {
    files: ['tests/accessibility/**/*.js', 'tests/accessibility/**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.jest,
      },
    },
  },

  {
    files: ['tests/e2e/**/*.js', 'tests/e2e/**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  prettier,
];
