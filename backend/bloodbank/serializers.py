from rest_framework import serializers
from .models import BloodBank, DonationCamp, CampRegistration


class BloodBankSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodBank
        fields = '__all__'


class DonationCampSerializer(serializers.ModelSerializer):
    registrations_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DonationCamp
        fields = '__all__'
        extra_kwargs = {
            'bloodbank': { 'read_only': True },
        }
    
    def get_registrations_count(self, obj):
        return obj.registrations.count()


class CampRegistrationSerializer(serializers.ModelSerializer):
    camp_name = serializers.CharField(source='camp.name', read_only=True)
    camp_start_date = serializers.DateField(source='camp.start_date', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    bloodbank_name = serializers.CharField(source='camp.bloodbank.name', read_only=True)
    
    class Meta:
        model = CampRegistration
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True},
            'status': {'read_only': True},
        }
    
    def validate(self, data):
        # Check if user already registered for this camp
        if self.instance is None:  # Creating new registration
            camp = data.get('camp')
            if camp:
                user = self.context['request'].user
                if CampRegistration.objects.filter(camp=camp, user=user).exists():
                    raise serializers.ValidationError({'camp': 'You have already registered for this camp.'})
        return data


