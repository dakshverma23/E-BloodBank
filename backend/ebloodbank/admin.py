"""
Custom admin site configuration
"""
from django.contrib import admin
from django.db.models import Count, Sum
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

# Import models
from accounts.models import User, UserProfile
from bloodbank.models import BloodBank, DonationCamp
from donors.models import Donor, Donation, Appointment
from inventory.models import Inventory
from requests.models import BloodRequest


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'user_type', 'phone', 'is_verified', 'is_superuser', 'is_staff', 'is_active', 'created_at')
    list_filter = ('user_type', 'is_verified', 'is_superuser', 'is_staff', 'is_active', 'created_at')
    search_fields = ('username', 'email', 'phone')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Authentication', {
            'fields': ('username', 'password')
        }),
        ('Personal Information', {
            'fields': ('email', 'phone', 'first_name', 'last_name')
        }),
        ('Account Type', {
            'fields': ('user_type', 'is_verified', 'external_id')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important Dates', {
            'fields': ('created_at', 'updated_at', 'last_login', 'date_joined')
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'city', 'state', 'pincode')
    search_fields = ('user__username', 'city', 'state', 'pincode')
    list_filter = ('state', 'city')


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
    list_display = ('name', 'bloodbank', 'city', 'camp_date', 'status', 'created_at')
    list_filter = ('status', 'camp_date', 'city', 'state', 'created_at')
    search_fields = ('name', 'bloodbank__name', 'city', 'state', 'address')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-camp_date',)


@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'blood_group', 'city', 'state', 'is_eligible', 'created_at')
    list_filter = ('blood_group', 'gender', 'is_eligible', 'state', 'city', 'created_at')
    search_fields = ('full_name', 'email', 'phone', 'city', 'state')
    readonly_fields = ('created_at', 'updated_at', 'age')
    ordering = ('-created_at',)


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ('donor', 'bloodbank', 'blood_group', 'units_donated', 'donation_date', 'created_at')
    list_filter = ('blood_group', 'donation_date', 'created_at')
    search_fields = ('donor__full_name', 'bloodbank__name')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-donation_date',)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('donor', 'bloodbank', 'appointment_date', 'status', 'created_at')
    list_filter = ('status', 'appointment_date', 'created_at')
    search_fields = ('donor__full_name', 'bloodbank__name')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-appointment_date',)


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('bloodbank', 'blood_group', 'units_available', 'min_stock_level', 'is_low_stock', 'last_updated')
    list_filter = ('blood_group', 'is_low_stock', 'last_updated')
    search_fields = ('bloodbank__name',)
    readonly_fields = ('last_updated', 'created_at', 'is_low_stock')
    ordering = ('bloodbank', 'blood_group')
    
    def is_low_stock(self, obj):
        if obj.units_available <= obj.min_stock_level:
            return format_html('<span style="color: red; font-weight: bold;">⚠️ Low Stock</span>')
        return format_html('<span style="color: green;">✓ In Stock</span>')
    is_low_stock.short_description = 'Stock Status'


@admin.register(BloodRequest)
class BloodRequestAdmin(admin.ModelAdmin):
    list_display = ('patient_name', 'blood_group', 'units_required', 'urgency', 'status', 'bloodbank', 'required_date', 'created_at')
    list_filter = ('status', 'urgency', 'blood_group', 'required_date', 'created_at')
    search_fields = ('patient_name', 'hospital_name', 'doctor_name', 'contact_number', 'requester__username')
    readonly_fields = ('request_id', 'created_at', 'approved_at', 'fulfilled_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Request Information', {
            'fields': ('requester', 'bloodbank', 'request_id', 'status')
        }),
        ('Patient Details', {
            'fields': ('patient_name', 'blood_group', 'units_required', 'urgency', 'required_date')
        }),
        ('Hospital Information', {
            'fields': ('hospital_name', 'doctor_name', 'contact_number', 'reason')
        }),
        ('Documents', {
            'fields': ('prescription_document',)
        }),
        ('Admin Actions', {
            'fields': ('admin_notes', 'approved_by', 'approved_at', 'fulfilled_at')
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )

