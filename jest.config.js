module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverage: false,
  testTimeout: 60000, // Increase default timeout for browser tests
  verbose: true,
  reporters: [
    'default',
    [
      'jest-junit',
      { outputDirectory: './test-reports', outputName: 'junit.xml' },
    ],
  ],
};
