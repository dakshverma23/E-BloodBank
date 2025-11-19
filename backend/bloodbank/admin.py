from django.contrib import admin
from .models import BloodBank, DonationCamp


@admin.register(BloodBank)
class BloodBankAdmin(admin.ModelAdmin):
    list_display = ('name', 'registration_number', 'city', 'state', 'status', 'is_operational', 'created_at')
    list_filter = ('status', 'is_operational', 'state', 'city', 'created_at')
    search_fields = ('name', 'registration_number', 'email', 'phone', 'city', 'state')
    readonly_fields = ('created_at', 'updated_at', 'approved_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'name', 'registration_number', 'email', 'phone')
        }),
        ('Location', {
            'fields': ('address', 'city', 'state', 'pincode', 'latitude', 'longitude')
        }),
        ('Status', {
            'fields': ('status', 'is_operational', 'operating_hours', 'approved_by', 'approved_at')
        }),
        ('Documents', {
            'fields': ('license_document',)
        }),
        ('Metadata', {
            'fields': ('external_id', 'created_at', 'updated_at')
        }),
    )


@admin.register(DonationCamp)
class DonationCampAdmin(admin.ModelAdmin):
    list_display = ('name', 'bloodbank', 'city', 'start_date', 'end_date', 'created_at')
    list_filter = ('start_date', 'end_date', 'city', 'state', 'created_at')
    search_fields = ('name', 'bloodbank__name', 'city', 'state', 'address')
    readonly_fields = ('created_at',)
    ordering = ('-start_date',)
