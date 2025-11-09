from django.contrib import admin
from .models import BloodBank, DonationCamp


@admin.register(BloodBank)
class BloodBankAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'state', 'status', 'is_operational')
    search_fields = ('name', 'registration_number', 'city', 'state')


@admin.register(DonationCamp)
class DonationCampAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'start_date', 'bloodbank')
    search_fields = ('name', 'city', 'bloodbank__name')
