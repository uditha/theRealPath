#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy || {
  echo "Migration failed, retrying in 5 seconds..."
  sleep 5
  npx prisma migrate deploy
}

echo "Starting server..."
exec node dist/server.js

