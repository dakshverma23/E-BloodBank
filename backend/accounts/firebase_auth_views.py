"""
Firebase authentication views for email and phone verification
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from .firebase_auth import verify_firebase_token, is_firebase_verified, clear_firebase_verification
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class FirebaseAuthVerifyView(APIView):
    """
    Verify Firebase ID token and store verification status
    POST /api/accounts/firebase/verify/
    Body: { "token": "firebase_id_token" }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Firebase token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify Firebase token
        try:
            user_info = verify_firebase_token(token)
        except Exception as e:
            logger.error(f"Exception verifying Firebase token: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Error verifying Firebase token: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        if not user_info:
            logger.error("Firebase token verification returned None - token may be invalid or expired")
            return Response(
                {'error': 'Invalid or expired Firebase token. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        email = user_info.get('email')
        phone_number = user_info.get('phone_number')
        email_verified = user_info.get('email_verified', False)
        
        # Check if email/phone is already registered
        user_exists = False
        if email:
            user_exists = User.objects.filter(email__iexact=email).exists()
        elif phone_number:
            phone_normalized = ''.join(filter(str.isdigit, phone_number))
            user_exists = User.objects.filter(phone=phone_normalized).exists()
        
        # Store verification status
        if email:
            is_firebase_verified(email, store=True)
        if phone_number:
            phone_normalized = ''.join(filter(str.isdigit, phone_number))
            is_firebase_verified(phone_normalized, store=True)
        
        # Return user info including whether user exists
        response_data = {
            'message': 'Email/Phone verified successfully via Firebase',
            'email': email,
            'phone_number': phone_number,
            'email_verified': email_verified,
            'name': user_info.get('name'),
            'uid': user_info.get('uid'),
            'user_exists': user_exists,
        }
        
        # If user exists, include a hint but don't block (frontend will handle)
        if user_exists:
            response_data['warning'] = 'This email/phone is already registered. Please login instead.'
        
        return Response(response_data, status=status.HTTP_200_OK)


class FirebaseAuthCheckView(APIView):
    """
    Check if email/phone is verified via Firebase
    POST /api/accounts/firebase/check/
    Body: { "email": "user@example.com" } or { "phone": "+1234567890" }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        phone = request.data.get('phone')
        
        if not email and not phone:
            return Response(
                {'error': 'Email or phone is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        identifier = email.strip().lower() if email else ''.join(filter(str.isdigit, phone.strip()))
        verified = is_firebase_verified(identifier)
        
        return Response({
            'identifier': identifier,
            'verified': verified,
        }, status=status.HTTP_200_OK)

