#!/bin/sh
set -e

PKG_HASH=$(md5sum package.json | cut -d' ' -f1)
HASH_FILE=node_modules/.pkg_hash

if [ ! -d node_modules ] || [ ! -f "$HASH_FILE" ] || [ "$(cat $HASH_FILE)" != "$PKG_HASH" ]; then
  echo "[entrypoint] package.json changed — running npm ci..."
  npm ci
  echo "$PKG_HASH" > "$HASH_FILE"
fi

exec "$@"
