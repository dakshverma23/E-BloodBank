#!/bin/bash
# Startup script for Render
# This ensures migrations are run before starting the server

# Ensure we're in the backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Run migrations - this is critical!
echo "=========================================="
echo "Running database migrations..."
echo "=========================================="
python manage.py migrate --noinput 2>&1
MIGRATE_EXIT=$?

if [ $MIGRATE_EXIT -ne 0 ]; then
    echo "ERROR: Migrations failed with exit code $MIGRATE_EXIT"
    echo "Attempting to show migration status..."
    python manage.py showmigrations
    echo "FATAL: Cannot start server without migrations. Exiting."
    exit 1
fi

echo "Migrations completed successfully!"

# Collect static files (in case build step missed it)
echo "=========================================="
echo "Collecting static files..."
echo "=========================================="
python manage.py collectstatic --noinput || true

# Start gunicorn
echo "=========================================="
echo "Starting gunicorn server..."
echo "=========================================="
exec gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT
