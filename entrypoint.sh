#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting migrations..."
# Run prisma migrate deploy
# We need to make sure the binary is available. In standalone mode, 
# we might need to point to the prism engine in the standalone folder.
# However, usually just npx prisma migrate deploy works if prisma is in dependencies.

npx prisma migrate deploy

echo "Starting the application..."
exec node server.js
