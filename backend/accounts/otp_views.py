"""
OTP Views for sending and verifying OTP codes
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.core.mail import send_mail
from django.conf import settings
from .models import OTP
from .serializers import SendOTPSerializer, VerifyOTPSerializer
import logging

logger = logging.getLogger(__name__)


class SendOTPView(APIView):
    """
    Send OTP to email or phone
    POST /api/accounts/otp/send/
    Body: { "email": "user@example.com", "otp_type": "email" }
    or: { "phone": "1234567890", "otp_type": "phone" }
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        email = validated_data.get('email')
        phone = validated_data.get('phone')
        otp_type = validated_data.get('otp_type', 'email')
        
        try:
            # Generate OTP
            otp = OTP.generate_otp(
                email=email,
                phone=phone,
                otp_type=otp_type,
                expiry_minutes=10  # OTP expires in 10 minutes
            )
            
            # Send OTP via email or phone
            email_sent = False
            email_configured = False
            is_console_backend = False
            email_error = None
            
            if otp_type == 'email' and email:
                # Check if email is configured before attempting to send
                email_host_user = getattr(settings, 'EMAIL_HOST_USER', None) or ''
                email_host_password = getattr(settings, 'EMAIL_HOST_PASSWORD', None) or ''
                email_configured = bool(email_host_user.strip() and email_host_password.strip())
                email_backend = getattr(settings, 'EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
                is_console_backend = 'console' in email_backend.lower()
                
                try:
                    self._send_email_otp(email, otp.code)
                    email_sent = True
        except Exception as e:
            email_error = str(e)
            error_type = type(e).__name__
            logger.error(f"Failed to send OTP email to {email}: {error_type}: {email_error}")
            logger.exception("Full email error traceback:")
            # Don't fail completely - still allow OTP to be used
            # Email sending failed, but we'll still return the OTP
            email_sent = False
                    
            elif otp_type == 'phone' and phone:
                # For phone, you would integrate with SMS service (Twilio, etc.)
                # For now, we'll log it. In production, use a proper SMS service
                logger.info(f"OTP for phone {phone}: {otp.code}")
                # TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
                # self._send_sms_otp(phone, otp.code)
            
            # Prepare response based on whether email was sent successfully
            if otp_type == 'email':
                if email_sent and email_configured and not is_console_backend:
                    # Email sent successfully via SMTP
                    response_data = {
                        'message': f'OTP has been sent to your email ({email}). Please check your inbox and spam folder.',
                        'expires_in_minutes': 10,
                    }
                elif email_sent and is_console_backend:
                    # Console backend - email printed to console (development mode)
                    response_data = {
                        'message': f'OTP generated! (Console backend - check server logs). OTP code: {otp.code}',
                        'expires_in_minutes': 10,
                        'otp_code': otp.code,
                        'email_not_configured': True,
                        'warning': 'Using console email backend. Configure SMTP for production.'
                    }
                elif not email_sent and email_error:
                    # Email sending failed - return OTP with error message
                    # Include error details for debugging (but don't expose sensitive info)
                    error_display = email_error
                    if 'password' in email_error.lower() or 'authentication' in email_error.lower():
                        error_display = "Email authentication failed. Please check your email credentials."
                    elif 'connection' in email_error.lower() or 'timeout' in email_error.lower():
                        error_display = "Could not connect to email server. Please check your internet connection."
                    
                    response_data = {
                        'message': f'OTP generated! However, email sending failed. Please use the OTP code below.',
                        'expires_in_minutes': 10,
                        'otp_code': otp.code,
                        'email_send_failed': True,
                        'error': error_display,
                        'error_details': email_error,  # Full error for debugging (can be removed in production)
                        'warning': 'Email could not be sent. Please check your email configuration or use the OTP code displayed below.'
                    }
                else:
                    # Email not configured
                    response_data = {
                        'message': f'OTP generated! Email is not configured. Please configure email settings.',
                        'expires_in_minutes': 10,
                        'otp_code': otp.code,
                        'email_not_configured': True,
                        'warning': 'Email credentials not configured. Please set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in .env file. See EMAIL_SETUP.md for instructions.'
                    }
            else:
                # Phone OTP - SMS not implemented yet
                response_data = {
                    'message': f'OTP generated! SMS service not configured yet. Use OTP code displayed below.',
                    'expires_in_minutes': 10,
                    'otp_code': otp.code,
                    'sms_not_configured': True,
                }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error sending OTP: {str(e)}")
            return Response(
                {'error': f'Failed to send OTP: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _send_email_otp(self, email, code):
        """Send OTP via email using configured email backend"""
        subject = 'Your E-BloodBank Verification Code'
        message = f'''
Hello,

Your OTP verification code for E-BloodBank is: {code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
E-BloodBank Team
        '''
        
        # Check if email is configured
        email_host_user = getattr(settings, 'EMAIL_HOST_USER', None) or ''
        email_host_password = getattr(settings, 'EMAIL_HOST_PASSWORD', None) or ''
        email_backend = getattr(settings, 'EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
        
        # Check if email credentials are configured (non-empty strings)
        email_configured = bool(email_host_user.strip() and email_host_password.strip())
        
        # If using console backend explicitly, allow it (for development)
        is_console_backend = 'console' in email_backend.lower()
        
        # If email is not configured and not using console backend, raise error
        if not email_configured and not is_console_backend:
            error_msg = (
                "Email credentials not configured. Please set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD "
                "in your .env file or environment variables. See EMAIL_SETUP.md for instructions."
            )
            logger.error(f"Cannot send OTP email to {email}: {error_msg}")
            raise ValueError(error_msg)
        
        # Send email using the configured backend
        try:
            send_mail(
                subject=subject,
                message=message.strip(),
                from_email=settings.DEFAULT_FROM_EMAIL or email_host_user or 'noreply@ebloodbank.com',
                recipient_list=[email],
                fail_silently=False,
            )
            if is_console_backend:
                logger.info(f"OTP sent via console backend to {email}: {code}")
            else:
                logger.info(f"OTP email sent successfully via SMTP to {email}")
        except Exception as e:
            error_msg = f"Failed to send OTP email to {email}: {str(e)}"
            logger.error(error_msg)
            # Re-raise the exception so it can be handled by the calling method
            raise Exception(error_msg) from e
    
    def _send_sms_otp(self, phone, code):
        """
        Send OTP via SMS
        TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
        """
        # Placeholder for SMS integration
        logger.info(f"SMS OTP for {phone}: {code}")
        # Example with Twilio:
        # from twilio.rest import Client
        # client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        # client.messages.create(
        #     body=f'Your E-BloodBank verification code is: {code}',
        #     from_=settings.TWILIO_PHONE_NUMBER,
        #     to=f'+91{phone}'  # Adjust country code as needed
        # )
        pass


class VerifyOTPView(APIView):
    """
    Verify OTP code
    POST /api/accounts/otp/verify/
    Body: { "email": "user@example.com", "code": "123456", "otp_type": "email" }
    or: { "phone": "1234567890", "code": "123456", "otp_type": "phone" }
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        email = validated_data.get('email')
        phone = validated_data.get('phone')
        code = validated_data.get('code')
        otp_type = validated_data.get('otp_type', 'email')
        
        try:
            is_valid, message = OTP.verify_otp(
                email=email,
                phone=phone,
                code=code,
                otp_type=otp_type
            )
            
            if is_valid:
                return Response({
                    'message': 'OTP verified successfully',
                    'verified': True
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': message,
                    'verified': False
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error verifying OTP: {str(e)}")
            return Response(
                {'error': f'Failed to verify OTP: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

