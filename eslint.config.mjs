import globals from 'globals';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/', 'node_modules/'],
  },

  js.configs.recommended,

  {
    files: ['build.js', 'aggregate_code.js'],
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

  prettier,
];
