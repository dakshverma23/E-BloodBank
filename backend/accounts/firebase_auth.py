"""
Firebase authentication for email and phone verification
Works with Render backend and Vercel frontend
"""
import json
import logging
import urllib.request
import urllib.parse
import urllib.error
from django.conf import settings
from django.core.cache import cache
import jwt
from datetime import datetime

logger = logging.getLogger(__name__)


def get_firebase_project_id():
    """Get Firebase project ID from settings"""
    return getattr(settings, 'FIREBASE_PROJECT_ID', None)


def verify_firebase_token(token):
    """
    Verify Firebase ID token
    Returns: dict with email, phone_number, etc. or None if invalid
    """
    try:
        project_id = get_firebase_project_id()
        if not project_id:
            logger.warning("FIREBASE_PROJECT_ID is not set in settings")
            # Try to decode token without verification (for development)
            try:
                decoded = jwt.decode(token, options={"verify_signature": False})
                return {
                    'email': decoded.get('email'),
                    'phone_number': decoded.get('phone_number'),
                    'email_verified': decoded.get('email_verified', False),
                    'name': decoded.get('name'),
                    'uid': decoded.get('user_id') or decoded.get('sub'),
                }
            except Exception as e:
                logger.error(f"Failed to decode Firebase token: {str(e)}")
                return None
        
        # Verify token using Firebase REST API
        # For production, use Firebase Admin SDK, but for Render/Vercel compatibility, use REST API
        url = f'https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key={getattr(settings, "FIREBASE_WEB_API_KEY", "")}'
        
        data = {
            'idToken': token
        }
        
        request = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(request, timeout=10) as response:
            if response.getcode() != 200:
                logger.error(f"Firebase API returned status {response.getcode()}")
                return None
            
            response_data = json.loads(response.read().decode('utf-8'))
            
            if 'error' in response_data:
                logger.error(f"Firebase API error: {response_data['error']}")
                return None
            
            users = response_data.get('users', [])
            if not users:
                logger.error("No user found in Firebase response")
                return None
            
            user_info = users[0]
            
            return {
                'email': user_info.get('email'),
                'phone_number': user_info.get('phoneNumber'),
                'email_verified': user_info.get('emailVerified', False),
                'name': user_info.get('displayName'),
                'uid': user_info.get('localId'),
            }
            
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
        logger.error(f"Firebase API HTTP error: {error_body}")
        return None
    except Exception as e:
        logger.error(f"Error verifying Firebase token: {str(e)}", exc_info=True)
        return None


def is_firebase_verified(email_or_phone, store=False):
    """
    Check if email/phone is verified via Firebase
    If store=True, store the verification status
    """
    if not email_or_phone:
        return False
    
    identifier = email_or_phone.strip().lower()
    verification_key = f'firebase_verified_{identifier}'
    
    if store:
        cache.set(verification_key, True, timeout=30 * 60)  # 30 minutes
        logger.info(f"Firebase verification stored for: {identifier}")
        return True
    
    return cache.get(verification_key) is not None


def clear_firebase_verification(email_or_phone):
    """
    Clear Firebase verification status
    """
    if not email_or_phone:
        return False
    
    identifier = email_or_phone.strip().lower()
    verification_key = f'firebase_verified_{identifier}'
    cache.delete(verification_key)
    logger.info(f"Firebase verification cleared for: {identifier}")
    return True

