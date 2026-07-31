#!/bin/sh
set -e

echo "Running database migrations..."
node /app/migrate.js

echo "Starting API server on port 8600..."
cd /app
node apps/api/dist/index.cjs &
API_PID=$!

echo "Starting Next.js frontend on port 5600..."
cd /app/apps/web
node server.js &
WEB_PID=$!

cleanup() {
  echo "Shutting down..."
  kill $API_PID $WEB_PID 2>/dev/null
  wait $API_PID $WEB_PID 2>/dev/null
  exit 0
}

trap cleanup SIGTERM SIGINT

wait $API_PID $WEB_PID
