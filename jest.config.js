/**
 * Jest configuration for the automated testing suite
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Set environment variables for tests
  setupFiles: ['<rootDir>/tests/setup.js'],

  // Test file patterns
  testMatch: ['<rootDir>/tests/**/*.test.js'],

  // Setup files
  setupFilesAfterEnv: [],

  // Coverage configuration
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Test timeout (30 seconds default)
  testTimeout: 30000,

  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Transform configuration (if needed for ES modules)
  transform: {},

  // Module name mapping for mocking ES modules
  moduleNameMapper: {
    '^marked$': '<rootDir>/tests/__mocks__/marked.js',
  },

  // Verbose output
  verbose: true,

  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-reports',
        outputName: 'junit.xml',
      },
    ],
  ],

  // Global setup and teardown
  globalSetup: undefined,
  globalTeardown: undefined,

  // Test result processor
  testResultsProcessor: undefined,
};
