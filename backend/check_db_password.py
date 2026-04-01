"""
Script to check the PostgreSQL password being used by Django
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ebloodbank.settings')
django.setup()

from django.conf import settings

print("=" * 50)
print("PostgreSQL Database Configuration")
print("=" * 50)
print(f"Database Name: {settings.DATABASES['default']['NAME']}")
print(f"Database User: {settings.DATABASES['default']['USER']}")
print(f"Database Password: {settings.DATABASES['default']['PASSWORD']}")
print(f"Database Host: {settings.DATABASES['default']['HOST']}")
print(f"Database Port: {settings.DATABASES['default']['PORT']}")
print("=" * 50)

# Check if password is from environment variable or default
env_password = os.environ.get('DATABASE_PASSWORD')
if env_password:
    print(f"\n✓ Password is set via DATABASE_PASSWORD environment variable")
    print(f"  Environment variable value: {env_password}")
else:
    print(f"\n✓ Password is using the default value from settings.py")
    print(f"  Default value: daksh@postgres")

print("\n" + "=" * 50)



