#!/bin/bash
cd backend
exec python3.11 -m gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT

