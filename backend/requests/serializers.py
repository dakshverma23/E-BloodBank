from rest_framework import serializers
from .models import BloodRequest


class BloodRequestSerializer(serializers.ModelSerializer):
    bloodbank_name = serializers.SerializerMethodField()
    approved_by_username = serializers.SerializerMethodField()
    requester_username = serializers.SerializerMethodField()
    
    class Meta:
        model = BloodRequest
        fields = '__all__'
        extra_kwargs = {
            'requester': {'read_only': True},
            'approved_by': {'read_only': True},
            'status': {'read_only': True},
            'request_id': {'read_only': True},
        }

    def get_bloodbank_name(self, obj):
        return obj.bloodbank.name if obj.bloodbank else None

    def get_approved_by_username(self, obj):
        return obj.approved_by.username if obj.approved_by else None

    def get_requester_username(self, obj):
        return obj.requester.username if obj.requester else None

    def validate_units_required(self, value: int):
        if value <= 0:
            raise serializers.ValidationError('units_required must be > 0')
        return value


