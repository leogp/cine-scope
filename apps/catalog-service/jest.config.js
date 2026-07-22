/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  transform: {
    // The service tsconfig has rootDir ./src, which excludes tests — point
    // ts-jest at the tests tsconfig instead.
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tests/tsconfig.json' }],
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['\\.int\\.test\\.ts$'],
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
}
