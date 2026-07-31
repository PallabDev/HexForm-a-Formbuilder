#!/bin/sh

echo "Running database migrations..."
node /app/migrate.js

echo "Starting API server on port 8600..."
cd /app
PORT=8600 node apps/api/dist/index.cjs &
API_PID=$!

echo "Starting Next.js frontend on port 5600..."
cd /app/apps/web
PORT=5600 node server.js &
WEB_PID=$!

cleanup() {
  echo "Shutting down..."
  kill $API_PID $WEB_PID 2>/dev/null
  wait $API_PID $WEB_PID 2>/dev/null
  exit 0
}

trap cleanup TERM INT

wait $API_PID $WEB_PID
