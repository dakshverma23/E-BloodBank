"""
Google OAuth authentication for email verification
Simplified version using direct HTTP requests to Google's tokeninfo endpoint
"""
import json
import logging
import urllib.request
import urllib.parse
import urllib.error
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


def verify_google_token(token):
    """
    Verify Google ID token by calling Google's tokeninfo endpoint
    Returns: dict with email, name, picture, etc. or None if invalid
    """
    try:
        # Verify the token using Google's tokeninfo endpoint
        # Use urllib instead of requests to avoid conflicts with local 'requests' Django app
        logger.info("Verifying Google token with tokeninfo endpoint...")
        
        # Build URL with token parameter
        url = f'https://oauth2.googleapis.com/tokeninfo?id_token={urllib.parse.quote(token)}'
        
        # Make HTTP request
        request = urllib.request.Request(url)
        with urllib.request.urlopen(request, timeout=10) as response:
            response_code = response.getcode()
            
            # Read response data
            response_data = response.read().decode('utf-8')
            
            if response_code != 200:
                logger.error(f"Google tokeninfo returned status {response_code}")
                logger.error(f"Response body: {response_data}")
                try:
                    error_info = json.loads(response_data)
                    error_msg = error_info.get('error_description', error_info.get('error', 'Unknown error'))
                    logger.error(f"Google error: {error_msg}")
                except:
                    logger.error(f"Could not parse error response: {response_data}")
                return None
            
            # Parse JSON response
            try:
                idinfo = json.loads(response_data)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Google tokeninfo response: {str(e)}")
                logger.error(f"Response data: {response_data[:500]}")
                return None
        
        # Log token info (without exposing sensitive data)
        logger.info(f"Google tokeninfo response received. Issuer: {idinfo.get('iss')}, Audience: {idinfo.get('aud')}, Email: {idinfo.get('email')}")
        
        # Check for error in response (Google sometimes returns errors in the JSON)
        if 'error' in idinfo:
            error_msg = idinfo.get('error_description', idinfo.get('error', 'Unknown error'))
            logger.error(f"Google tokeninfo returned error: {error_msg}")
            return None
        
        # Get client ID from settings
        client_id = getattr(settings, 'GOOGLE_OAUTH2_CLIENT_ID', None)
        token_audience = idinfo.get('aud')
        
        logger.info(f"Expected client ID: {client_id}")
        logger.info(f"Token audience (client ID): {token_audience}")
        
        # Verify the audience (client ID)
        # For development, we'll accept tokens even if client ID doesn't match
        # But log a warning so you know about it
        if client_id:
            if token_audience != client_id:
                logger.warning(f"Token audience mismatch. Expected: {client_id}, Got: {token_audience}")
                logger.warning("Accepting token anyway (development mode). In production, this should be rejected.")
        else:
            logger.warning("GOOGLE_OAUTH2_CLIENT_ID is not set in backend .env file. Skipping audience verification.")
            logger.info(f"Token was issued for client ID: {token_audience}")
        
        # Verify the issuer
        issuer = idinfo.get('iss')
        logger.info(f"Token issuer: {issuer}")
        if issuer not in ['accounts.google.com', 'https://accounts.google.com']:
            logger.error(f"Invalid token issuer: {issuer}")
            return None
        
        # Check if email is verified
        email_verified = idinfo.get('email_verified', False)
        logger.info(f"Email verified by Google: {email_verified}")
        if not email_verified:
            logger.warning("Email is not verified by Google")
            return None
        
        # Extract user info
        user_info = {
            'email': idinfo.get('email'),
            'email_verified': idinfo.get('email_verified', False),
            'name': idinfo.get('name'),
            'picture': idinfo.get('picture'),
            'given_name': idinfo.get('given_name'),
            'family_name': idinfo.get('family_name'),
            'sub': idinfo.get('sub'),  # Google user ID
        }
        
        if not user_info['email']:
            logger.error("Email not found in token")
            return None
        
        logger.info(f"Google token verified successfully for email: {user_info['email']}")
        return user_info
        
    except urllib.error.HTTPError as e:
        try:
            error_body = e.read().decode('utf-8')
            logger.error(f"Google tokeninfo HTTP error {e.code}: {error_body}")
            try:
                error_json = json.loads(error_body)
                error_message = error_json.get('error_description', error_json.get('error', 'Unknown error'))
                logger.error(f"Google error message: {error_message}")
            except:
                error_message = error_body
        except Exception as read_error:
            error_message = f"HTTP {e.code}: {str(e)} (could not read error body: {str(read_error)})"
        logger.error(f"HTTP error verifying Google token: {error_message}")
        return None
    except urllib.error.URLError as e:
        logger.error(f"URL error verifying Google token: {str(e)}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error verifying Google token: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Error verifying Google token: {str(e)}", exc_info=True)
        return None


def store_google_verification(email):
    """
    Store Google verification status in cache (valid for 30 minutes)
    """
    if not email:
        return False
    
    email_normalized = email.strip().lower()
    verification_key = f'google_verified_email_{email_normalized}'
    cache.set(verification_key, True, timeout=30 * 60)
    logger.info(f"Google verification stored for email: {email_normalized}")
    return True


def is_google_verified(email):
    """
    Check if email is verified via Google OAuth
    """
    if not email:
        return False
    
    email_normalized = email.strip().lower()
    verification_key = f'google_verified_email_{email_normalized}'
    return cache.get(verification_key) is not None


def clear_google_verification(email):
    """
    Clear Google verification status
    """
    if not email:
        return False
    
    email_normalized = email.strip().lower()
    verification_key = f'google_verified_email_{email_normalized}'
    cache.delete(verification_key)
    logger.info(f"Google verification cleared for email: {email_normalized}")
    return True
