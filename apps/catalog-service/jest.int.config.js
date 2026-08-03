const base = require('./jest.config')

/**
 * Integration-test config: only *.int.test.ts files, which need a running
 * Postgres (catalog_test_db). Run through `npm run test:int`.
 */
/** @type {import('jest').Config} */
module.exports = {
  ...base,
  testMatch: ['**/*.int.test.ts'],
  testPathIgnorePatterns: [],
}
