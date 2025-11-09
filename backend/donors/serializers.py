from rest_framework import serializers
from .models import Donor, Donation, Appointment


class DonorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donor
        fields = '__all__'


class DonationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donation
        fields = '__all__'

    def validate_units_donated(self, value: int):
        if value <= 0:
            raise serializers.ValidationError('units_donated must be > 0')
        return value


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = '__all__'


