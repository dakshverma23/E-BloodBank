from rest_framework import serializers
from .models import Inventory


class InventorySerializer(serializers.ModelSerializer):
    bloodbank_name = serializers.CharField(source='bloodbank.name', read_only=True)
    
    class Meta:
        model = Inventory
        fields = '__all__'
        extra_kwargs = {
            'bloodbank': {'read_only': True},
        }

    def validate_units_available(self, value: int):
        if value < 0:
            raise serializers.ValidationError('units_available cannot be negative')
        return value

    def validate_min_stock_level(self, value: int):
        if value < 0:
            raise serializers.ValidationError('min_stock_level cannot be negative')
        return value


