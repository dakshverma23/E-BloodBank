from django.contrib import admin
from .models import Donor, Donation, Appointment


@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'blood_group', 'city', 'state', 'is_eligible', 'created_at')
    list_filter = ('blood_group', 'gender', 'is_eligible', 'state', 'city', 'created_at')
    search_fields = ('full_name', 'email', 'phone', 'city', 'state')
    readonly_fields = ('created_at', 'updated_at', 'age')
    ordering = ('-created_at',)


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ('donor', 'bloodbank', 'units_donated', 'donation_date', 'created_at')
    list_filter = ('donation_date', 'created_at')
    search_fields = ('donor__full_name', 'bloodbank__name')
    readonly_fields = ('created_at',)
    ordering = ('-donation_date',)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'bloodbank', 'appointment_date', 'status', 'created_at')
    list_filter = ('status', 'appointment_date', 'created_at')
    search_fields = ('user__username', 'bloodbank__name')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-appointment_date',)
