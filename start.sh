#!/bin/sh
set -e

echo "=== TaskFlow Startup ==="

# Run database migrations
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    echo "Running Prisma migrations..."
    ./node_modules/.bin/prisma migrate deploy
    echo "Migrations completed successfully!"
else
    echo "No migrations found, skipping..."
fi

# Start the Next.js server
echo "Starting server..."
exec node server.js
