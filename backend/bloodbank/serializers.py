from rest_framework import serializers
from .models import BloodBank, DonationCamp


class BloodBankSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodBank
        fields = '__all__'


class DonationCampSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationCamp
        fields = '__all__'
        extra_kwargs = {
            'bloodbank': { 'read_only': True },
        }


