#!/bin/bash
# Force the correct WSGI application
cd backend
exec gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:${PORT:-10000}

