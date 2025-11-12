"""
Google OAuth views for email verification
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from .google_auth import verify_google_token, store_google_verification, is_google_verified, clear_google_verification
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class GoogleAuthVerifyView(APIView):
    """
    Verify Google ID token and store verification status
    POST /api/accounts/google/verify/
    Body: { "token": "google_id_token" }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Google token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify Google token
        try:
            user_info = verify_google_token(token)
        except Exception as e:
            logger.error(f"Exception verifying Google token: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Error verifying Google token: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        if not user_info:
            logger.error("Google token verification returned None - token may be invalid or expired")
            # Check logs for more details about why verification failed
            return Response(
                {'error': 'Invalid or expired Google token. Please try signing in with Google again.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        email = user_info.get('email')
        email_verified = user_info.get('email_verified', False)
        
        if not email:
            return Response(
                {'error': 'Email not found in Google token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not email_verified:
            return Response(
                {'error': 'Email is not verified by Google'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if email is already registered - but don't block, just return info
        user_exists = User.objects.filter(email__iexact=email).exists()
        
        # Store verification status
        store_google_verification(email)
        
        # Return user info including whether user exists
        response_data = {
            'message': 'Email verified successfully via Google',
            'email': email,
            'name': user_info.get('name'),
            'given_name': user_info.get('given_name'),
            'family_name': user_info.get('family_name'),
            'picture': user_info.get('picture'),
            'user_exists': user_exists,
        }
        
        # If user exists, include a hint but don't block (frontend will handle)
        if user_exists:
            response_data['warning'] = 'This email is already registered. Please login instead.'
        
        return Response(response_data, status=status.HTTP_200_OK)


class GoogleAuthCheckView(APIView):
    """
    Check if email is verified via Google OAuth
    POST /api/accounts/google/check/
    Body: { "email": "user@example.com" }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        email_normalized = email.strip().lower()
        verified = is_google_verified(email_normalized)
        
        return Response({
            'email': email_normalized,
            'verified': verified,
        }, status=status.HTTP_200_OK)

