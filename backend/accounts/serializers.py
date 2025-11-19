from rest_framework import serializers
from .models import User, UserProfile, OTP


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'date_of_birth', 'address', 'city', 'state', 'pincode', 'profile_picture']


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'user_type', 'is_active', 'is_staff', 'is_superuser', 'password', 'profile']
        read_only_fields = ['is_staff', 'is_superuser', 'is_active']

    def validate_phone(self, value):
        """Validate that phone number is exactly 10 digits"""
        # Remove all non-digit characters
        phone_digits = ''.join(filter(str.isdigit, str(value)))
        
        if len(phone_digits) != 10:
            raise serializers.ValidationError('Phone number must be exactly 10 digits')
        
        return phone_digits

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class MeSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'external_id', 'username', 'email', 'phone', 'user_type', 'profile']


class SendOTPSerializer(serializers.Serializer):
    """Serializer for sending OTP"""
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=15)
    otp_type = serializers.ChoiceField(choices=['email', 'phone'], default='email')
    
    def validate(self, data):
        email = data.get('email')
        phone = data.get('phone')
        otp_type = data.get('otp_type', 'email')
        
        if otp_type == 'email' and not email:
            raise serializers.ValidationError({'email': 'Email is required for email OTP'})
        
        if otp_type == 'phone' and not phone:
            raise serializers.ValidationError({'phone': 'Phone is required for phone OTP'})
        
        # Normalize phone to digits only
        if phone:
            phone_digits = ''.join(filter(str.isdigit, phone))
            if len(phone_digits) != 10:
                raise serializers.ValidationError({'phone': 'Phone number must be exactly 10 digits'})
            data['phone'] = phone_digits
        
        # Normalize email
        if email:
            data['email'] = email.strip().lower()
        
        return data


class VerifyOTPSerializer(serializers.Serializer):
    """Serializer for verifying OTP"""
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=15)
    code = serializers.CharField(max_length=6, min_length=6, required=True)
    otp_type = serializers.ChoiceField(choices=['email', 'phone'], default='email')
    
    def validate(self, data):
        email = data.get('email')
        phone = data.get('phone')
        otp_type = data.get('otp_type', 'email')
        code = data.get('code')
        
        if not code or len(code) != 6:
            raise serializers.ValidationError({'code': 'OTP code must be exactly 6 digits'})
        
        if otp_type == 'email' and not email:
            raise serializers.ValidationError({'email': 'Email is required for email OTP verification'})
        
        if otp_type == 'phone' and not phone:
            raise serializers.ValidationError({'phone': 'Phone is required for phone OTP verification'})
        
        # Normalize phone to digits only
        if phone:
            phone_digits = ''.join(filter(str.isdigit, phone))
            if len(phone_digits) != 10:
                raise serializers.ValidationError({'phone': 'Phone number must be exactly 10 digits'})
            data['phone'] = phone_digits
        
        # Normalize email
        if email:
            data['email'] = email.strip().lower()
        
        return data
