/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.e2e.test.ts'],
  // Once per run, before any test file: waits for the stack, then logs in, signs
  // up and creates the shared catalog fixtures (support/globalSetup.ts).
  globalSetup: '<rootDir>/support/globalSetup.ts',
  // Real network calls, some polled until the cache settles: Jest's 5 s is too tight.
  testTimeout: 30_000,
}
