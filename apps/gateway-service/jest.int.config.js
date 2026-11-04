const base = require('./jest.config')

/**
 * Integration-test config: only *.int.test.ts files, which need a running
 * Redis (logical database 15). Run through `npm run test:int`.
 */
/** @type {import('jest').Config} */
module.exports = {
  ...base,
  testMatch: ['**/*.int.test.ts'],
  testPathIgnorePatterns: [],
}
