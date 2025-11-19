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
            
            # Check if email credentials are configured
            email_host_user = getattr(settings, 'EMAIL_HOST_USER', None)
            email_configured = bool(email_host_user)
            
            response_data = {
                'message': f'OTP has been sent to your {otp_type}',
                'expires_in_minutes': 10,
            }
            
            # In development or if email is not configured, send OTP in response
            # This helps with testing when email backend is not set up
            if settings.DEBUG or not email_configured:
                response_data['otp_code'] = otp.code
                if not email_configured:
                    response_data['message'] = f'OTP has been sent. Check console/logs for OTP code. Your OTP is also displayed below.'
                    response_data['email_not_configured'] = True
            
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
        email_backend = getattr(settings, 'EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
        
        # If email is not configured, use console backend or log it
        if not email_host_user:
            # Use console backend to print OTP in development
            from django.core.mail import get_connection
            from django.core.mail.message import EmailMessage
            try:
                # Try console backend if available
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
            except Exception as console_error:
                # If console backend fails, just log it
                logger.warning(f"Console email backend failed: {console_error}. OTP code for {email}: {code}")
                print(f"\n{'='*60}")
                print(f"OTP CODE for {email}: {code}")
                print(f"{'='*60}\n")
        else:
            try:
                send_mail(
                    subject=subject,
                    message=message.strip(),
                    from_email=settings.DEFAULT_FROM_EMAIL or email_host_user,
                    recipient_list=[email],
                    fail_silently=False,
                )
                logger.info(f"OTP email sent to {email}")
            except Exception as e:
                logger.error(f"Error sending email OTP: {str(e)}")
                # Fallback: print to console if email sending fails
                print(f"\n{'='*60}")
                print(f"Email sending failed. OTP CODE for {email}: {code}")
                print(f"Error: {str(e)}")
                print(f"{'='*60}\n")
                raise
    
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

