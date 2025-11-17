#!/bin/bash
cd backend
exec gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT

