process.env.NODE_ENV = 'test'
process.env.DATABASE_URL ??=
  'postgresql://cinescope:cinescope_secret@localhost:5432/catalog_test_db'
// Mirrors auth-service's test secret so a token minted in tests/helpers/authToken
// verifies against the guards the real app builds.
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-0123456789'
