from rest_framework import serializers
from .models import Donor, Donation, Appointment


class DonorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donor
        fields = '__all__'


class DonationSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True, required=False, allow_null=True, help_text="User ID to auto-create donor profile if donor doesn't exist")
    email = serializers.EmailField(write_only=True, required=False, allow_blank=True, allow_null=True, help_text="Email to search user and auto-create donor profile if donor doesn't exist")
    blood_group = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True, help_text="Blood group for auto-created donor profile")
    
    class Meta:
        model = Donation
        fields = '__all__'
        extra_kwargs = {
            'donor': {'required': False, 'allow_null': True},  # Donor is optional if user_id or email is provided
            'bloodbank': {'read_only': True},  # Bloodbank is auto-assigned
            'verified_by': {'required': True},  # Make sure verified_by is required
        }

    def validate_user_id(self, value):
        # Convert to int if it's a string
        if value is not None and value != '':
            try:
                return int(value)
            except (ValueError, TypeError):
                raise serializers.ValidationError('user_id must be a valid integer')
        return None if value == '' else value

    def validate_units_donated(self, value):
        if value is not None:
            try:
                value = int(value)
                if value <= 0:
                    raise serializers.ValidationError('units_donated must be > 0')
            except (ValueError, TypeError):
                raise serializers.ValidationError('units_donated must be a valid integer')
        return value
    
    def validate_verified_by(self, value):
        # Ensure verified_by is not empty
        if value is None:
            raise serializers.ValidationError('verified_by is required')
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise serializers.ValidationError('verified_by cannot be empty')
            return value
        return str(value).strip() if value else None
    
    def validate_donation_date(self, value):
        # Ensure date is properly formatted
        if value is None:
            raise serializers.ValidationError('donation_date is required')
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise serializers.ValidationError('donation_date is required')
            from django.utils.dateparse import parse_date
            parsed = parse_date(value)
            if parsed is None:
                raise serializers.ValidationError('Invalid date format. Use YYYY-MM-DD')
            return parsed
        # If it's already a date object, return as-is
        return value
    
    def validate(self, data):
        # If donor is not provided but user_id or email is, we'll handle it in the view
        donor = data.get('donor')
        user_id = data.get('user_id')
        email = data.get('email', '').strip().lower() if data.get('email') else None
        
        # Convert user_id to int if it's provided
        if user_id is not None and user_id != '':
            try:
                user_id = int(user_id)
                data['user_id'] = user_id
            except (ValueError, TypeError):
                user_id = None
                data['user_id'] = None
        elif user_id == '':
            user_id = None
            data['user_id'] = None
        
        # Normalize email
        if email:
            data['email'] = email
        
        # Validate that either donor, user_id, or email is provided
        if not donor and (not user_id or user_id == 0) and not email:
            raise serializers.ValidationError({'email': ['Either donor, user_id, or email must be provided']})
        
        return data


class AppointmentSerializer(serializers.ModelSerializer):
    bloodbank_name = serializers.CharField(source='bloodbank.name', read_only=True)
    bloodbank_city = serializers.CharField(source='bloodbank.city', read_only=True)
    bloodbank_address = serializers.CharField(source='bloodbank.address', read_only=True)
    bloodbank_phone = serializers.CharField(source='bloodbank.phone', read_only=True)
    bloodbank_email = serializers.CharField(source='bloodbank.email', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    
    class Meta:
        model = Appointment
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True},
            # bloodbank should be writable during creation, but we'll handle it in perform_create
        }
    
    def validate_appointment_date(self, value):
        """Ensure appointment date is not in the past"""
        from django.utils import timezone
        if value is None:
            raise serializers.ValidationError('Appointment date is required.')
        if value < timezone.now().date():
            raise serializers.ValidationError('Appointment date cannot be in the past.')
        return value
    
    def validate_bloodbank(self, value):
        """Ensure blood bank is approved and operational"""
        from bloodbank.models import BloodBank
        
        # Handle both ID (int) and BloodBank object
        if value is None:
            raise serializers.ValidationError('Blood bank is required.')
        
        # If value is an integer (ID), fetch the BloodBank object
        if isinstance(value, int):
            try:
                bloodbank = BloodBank.objects.get(id=value)
            except BloodBank.DoesNotExist:
                raise serializers.ValidationError(f'Blood bank with ID {value} does not exist.')
            value = bloodbank
        
        # Now validate the BloodBank object
        if not isinstance(value, BloodBank):
            raise serializers.ValidationError('Invalid blood bank provided.')
        
        # Check status - allow both 'approved' status OR if user is the blood bank owner
        if value.status != 'approved':
            raise serializers.ValidationError(
                f'This blood bank is not approved (current status: {value.get_status_display()}). '
                'Please select an approved blood bank.'
            )
        
        if not value.is_operational:
            raise serializers.ValidationError('This blood bank is currently not operational.')
        
        return value
    
    def validate_status(self, value):
        """Validate status choices"""
        if value:
            valid_statuses = ['pending', 'approved', 'rejected', 'completed']
            if value not in valid_statuses:
                raise serializers.ValidationError(f'Status must be one of: {", ".join(valid_statuses)}')
        return value


