#!/bin/bash
# Creates one database per entry in POSTGRES_MULTIPLE_DATABASES (comma-separated).
# Runs automatically on first container init (empty volume) via docker-entrypoint-initdb.d.
set -e
set -u

create_database() {
  local database=$1
  echo "Creating database '$database'"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
    CREATE DATABASE "$database";
EOSQL
}

if [ -n "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
  for db in $(echo "$POSTGRES_MULTIPLE_DATABASES" | tr ',' ' '); do
    create_database "$db"
  done
  echo "All databases created: $POSTGRES_MULTIPLE_DATABASES"
fi
