from rest_framework import serializers
from .models import BloodRequest


class BloodRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodRequest
        fields = '__all__'
        extra_kwargs = {
            'requester': {'read_only': True},
            'approved_by': {'read_only': True},
            'status': {'read_only': True},
            'request_id': {'read_only': True},
        }

    def validate_units_required(self, value: int):
        if value <= 0:
            raise serializers.ValidationError('units_required must be > 0')
        return value


