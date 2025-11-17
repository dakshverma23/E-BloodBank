#!/usr/bin/env python
"""Test script to verify all imports work correctly"""
import os
import sys
import django

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ebloodbank.settings')

# Setup Django
django.setup()

# Test imports
try:
    from django.core.wsgi import get_wsgi_application
    application = get_wsgi_application()
    print("✅ WSGI application loaded successfully!")
    print(f"✅ Django version: {django.get_version()}")
    
    # Test app imports
    from accounts.models import User
    print("✅ Accounts app imported successfully!")
    
    from bloodbank.models import BloodBank
    print("✅ Bloodbank app imported successfully!")
    
    from donors.models import Donor
    print("✅ Donors app imported successfully!")
    
    print("\n🎉 All imports successful! Django is ready to run.")
    sys.exit(0)
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

