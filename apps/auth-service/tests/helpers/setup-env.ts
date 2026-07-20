process.env.NODE_ENV = 'test'
process.env.DATABASE_URL ??= 'postgresql://cinescope:cinescope_secret@localhost:5432/auth_test_db'
process.env.JWT_ACCESS_SECRET = 'test-access-secret-0123456789'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-0123456789'
