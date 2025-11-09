from django.contrib import admin
from .models import Inventory


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('bloodbank', 'blood_group', 'units_available', 'min_stock_level')
    search_fields = ('bloodbank__name', 'blood_group')
