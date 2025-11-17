"""
Script to create a superuser if one doesn't exist.
Can be run non-interactively using environment variables.
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ebloodbank.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()

def create_superuser():
    """Create superuser from environment variables if it doesn't exist."""
    username = os.environ.get('ADMIN_USERNAME', 'admin')
    email = os.environ.get('ADMIN_EMAIL', 'admin@ebloodbank.com')
    phone = os.environ.get('ADMIN_PHONE', '1234567890')
    password = os.environ.get('ADMIN_PASSWORD')
    user_type = os.environ.get('ADMIN_USER_TYPE', 'admin')
    
    if not password:
        print("ADMIN_PASSWORD not set. Skipping superuser creation.")
        return
    
    try:
        if User.objects.filter(username=username).exists():
            print(f"User '{username}' already exists. Skipping creation.")
            return
        
        User.objects.create_superuser(
            username=username,
            email=email,
            phone=phone,
            password=password,
            user_type=user_type
        )
        print(f"Superuser '{username}' created successfully!")
    except IntegrityError as e:
        print(f"Error creating superuser: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == '__main__':
    create_superuser()

