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
            
            return Response({
                'message': f'OTP has been sent to your {otp_type}',
                'expires_in_minutes': 10,
                # In production, don't send the OTP code in response
                # For development only:
                **({'otp_code': otp.code} if settings.DEBUG else {})
            }, status=status.HTTP_200_OK)
            
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
        
        try:
            send_mail(
                subject=subject,
                message=message.strip(),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            logger.info(f"OTP email sent to {email}")
        except Exception as e:
            logger.error(f"Error sending email OTP: {str(e)}")
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

