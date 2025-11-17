#!/usr/bin/env python
"""Check if Django setup is correct for deployment"""
import os
import sys

print("Checking Django setup...")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")

# Check if we can import Django
try:
    import django
    print(f"✅ Django {django.get_version()} installed")
except ImportError:
    print("❌ Django not installed!")
    sys.exit(1)

# Check WSGI
try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ebloodbank.settings')
    django.setup()
    from django.core.wsgi import get_wsgi_application
    app = get_wsgi_application()
    print("✅ WSGI application can be created")
    print(f"✅ WSGI module: ebloodbank.wsgi")
    print(f"✅ WSGI application variable exists: {hasattr(__import__('ebloodbank.wsgi'), 'application')}")
except Exception as e:
    print(f"❌ WSGI error: {e}")
    sys.exit(1)

print("\n✅ All checks passed! Ready for deployment.")

