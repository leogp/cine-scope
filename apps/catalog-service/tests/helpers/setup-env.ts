process.env.NODE_ENV = 'test'
process.env.DATABASE_URL ??=
  'postgresql://cinescope:cinescope_secret@localhost:5432/catalog_test_db'
