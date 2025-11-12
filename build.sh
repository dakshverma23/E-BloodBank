#!/usr/bin/env bash
# exit on error
set -o errexit

# Change to the backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Apply database migrations
python manage.py migrate