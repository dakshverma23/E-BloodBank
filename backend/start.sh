#!/bin/bash
# Startup script for Render
# This ensures migrations are run before starting the server

set -e  # Exit on error

cd "$(dirname "$0")"

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput || {
    echo "Migration failed, trying with fake initial..."
    python manage.py migrate --run-syncdb --noinput
}

# Collect static files (in case build step missed it)
echo "Collecting static files..."
python manage.py collectstatic --noinput || true

# Start gunicorn
echo "Starting gunicorn..."
exec gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT
