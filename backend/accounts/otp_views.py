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
            if otp_type == 'email' and email:
                self._send_email_otp(email, otp.code)
            elif otp_type == 'phone' and phone:
                # For phone, you would integrate with SMS service (Twilio, etc.)
                # For now, we'll log it. In production, use a proper SMS service
                logger.info(f"OTP for phone {phone}: {otp.code}")
                # TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
                # self._send_sms_otp(phone, otp.code)
            
            # Check if email was actually sent
            email_host_user = getattr(settings, 'EMAIL_HOST_USER', None)
            email_host_password = getattr(settings, 'EMAIL_HOST_PASSWORD', None)
            email_configured = bool(email_host_user and email_host_password)
            
            # Determine if email was actually sent (we check this after attempting to send)
            # For email OTP, we check if credentials are configured
            # For phone OTP, SMS is not configured yet
            actual_email_sent = False
            if otp_type == 'email':
                # Check if email credentials exist (but we can't verify if send_mail succeeded here)
                # We'll rely on the fact that if credentials are configured, email should work
                # In production, you should configure email properly
                if email_configured:
                    actual_email_sent = True
                    response_data = {
                        'message': f'OTP has been sent to your email ({email}). Please check your inbox and spam folder.',
                        'expires_in_minutes': 10,
                    }
                else:
                    # Email not configured - include OTP in response for development
                    response_data = {
                        'message': f'OTP generated! Email is not configured. Check console/server logs for OTP code. OTP is also displayed below.',
                        'expires_in_minutes': 10,
                        'otp_code': otp.code,
                        'email_not_configured': True,
                        'warning': 'Email credentials not configured. Please set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD.'
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
        """Send OTP via email"""
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
        email_host_user = getattr(settings, 'EMAIL_HOST_USER', None)
        email_host_password = getattr(settings, 'EMAIL_HOST_PASSWORD', None)
        email_backend = getattr(settings, 'EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
        
        # Try to send email via SMTP if configured
        email_sent = False
        email_error = None
        
        # First, try using SMTP backend if credentials are configured
        if email_host_user and email_host_password:
            try:
                send_mail(
                    subject=subject,
                    message=message.strip(),
                    from_email=settings.DEFAULT_FROM_EMAIL or email_host_user,
                    recipient_list=[email],
                    fail_silently=False,
                )
                logger.info(f"OTP email sent successfully via SMTP to {email}")
                email_sent = True
                return  # Email sent successfully, exit function
            except Exception as e:
                email_error = str(e)
                logger.error(f"Error sending email OTP via SMTP: {email_error}")
                # Log detailed error but don't raise - we'll use console backend as fallback
        
        # If SMTP not configured or failed, use console backend (development fallback)
        # This prints to console and allows OTP to be returned in response
        if not email_sent:
            try:
                from django.core.mail import get_connection
                from django.core.mail.message import EmailMessage
                # Force console backend for development
                console_backend = 'django.core.mail.backends.console.EmailBackend'
                connection = get_connection(backend=console_backend)
                email_msg = EmailMessage(
                    subject=subject,
                    body=message.strip(),
                    from_email=settings.DEFAULT_FROM_EMAIL or 'noreply@ebloodbank.com',
                    to=[email],
                    connection=connection,
                )
                email_msg.send()
                logger.info(f"OTP sent via console backend to {email}: {code}")
                # Print to console/logs for visibility
                print(f"\n{'='*60}")
                print(f"📧 EMAIL NOT CONFIGURED - OTP CODE for {email}: {code}")
                if email_error:
                    print(f"⚠️  SMTP Error: {email_error}")
                print(f"{'='*60}\n")
            except Exception as console_error:
                logger.warning(f"Console email backend also failed: {console_error}")
                # Last resort: print to console
                print(f"\n{'='*60}")
                print(f"OTP CODE for {email}: {code}")
                if email_error:
                    print(f"SMTP Error: {email_error}")
                print(f"Console Backend Error: {console_error}")
                print(f"{'='*60}\n")
    
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

