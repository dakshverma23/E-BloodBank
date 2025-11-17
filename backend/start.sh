#!/bin/bash
exec gunicorn ebloodbank.wsgi:application --bind 0.0.0.0:$PORT

