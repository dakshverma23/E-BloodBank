from django.contrib import admin
from django.utils.html import format_html
from .models import Inventory


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('bloodbank', 'blood_group', 'units_available', 'min_stock_level', 'stock_status', 'last_updated')
    list_filter = ('blood_group', 'last_updated')
    search_fields = ('bloodbank__name',)
    readonly_fields = ('last_updated', 'created_at', 'is_low_stock')
    ordering = ('bloodbank', 'blood_group')
    
    def stock_status(self, obj):
        if obj.units_available <= obj.min_stock_level:
            return format_html('<span style="color: #ef4444; font-weight: bold;">⚠️ Low Stock</span>')
        return format_html('<span style="color: #10b981; font-weight: bold;">✓ In Stock</span>')
    stock_status.short_description = 'Stock Status'
