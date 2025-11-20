from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import serializers
from .firebase_auth import verify_firebase_token
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    firebase_token = serializers.CharField(required=False, write_only=True)
    
    @classmethod
    def get_token(cls, user):
        return super().get_token(user)

    def validate(self, attrs):
        # Check if Firebase token is provided
        firebase_token = attrs.pop('firebase_token', None)
        
        if firebase_token:
            # Verify Firebase token and authenticate user
            user_info = verify_firebase_token(firebase_token)
            if not user_info:
                raise serializers.ValidationError('Invalid or expired Firebase token.')
            
            email = user_info.get('email')
            if not email:
                raise serializers.ValidationError('Email not found in Firebase token.')
            
            # Find user by email
            try:
                user = User.objects.get(email__iexact=email)
            except User.DoesNotExist:
                raise serializers.ValidationError('User not found. Please sign up first.')
            
            # Return tokens for the user
            refresh = self.get_token(user)
            data = {}
            data['refresh'] = str(refresh)
            data['access'] = str(refresh.access_token)
            return data
        
        # Regular username/password authentication
        username = attrs.get('username') or ''
        if '@' in username:
            try:
                user_obj = User.objects.get(email=username)
                attrs = attrs.copy()
                attrs['username'] = user_obj.username
            except User.DoesNotExist:
                pass
        return super().validate(attrs)


class EmailOrUsernameTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailOrUsernameTokenObtainPairSerializer


