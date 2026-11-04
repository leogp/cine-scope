/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  transform: {
    // The service tsconfig has rootDir ./src, which excludes tests — point
    // ts-jest at the tests tsconfig instead.
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tests/tsconfig.json' }],
  },
  // Jest's resolver does not read tsconfig `paths` — keep in sync with tsconfig.
  moduleNameMapper: { '^@gateway/(.*)$': '<rootDir>/src/$1' },
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  // *.int.test.ts need a running Redis; they run through `npm run test:int`.
  testPathIgnorePatterns: ['\\.int\\.test\\.ts$'],
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
}
