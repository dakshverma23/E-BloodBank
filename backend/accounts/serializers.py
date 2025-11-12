from rest_framework import serializers
from .models import User, UserProfile


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


