from django.contrib import admin
from .models import Donor, Donation


@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'blood_group', 'city', 'state', 'is_eligible')
    search_fields = ('full_name', 'city', 'state', 'blood_group')


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ('donor', 'bloodbank', 'donation_date', 'units_donated')
    search_fields = ('donor__full_name', 'bloodbank__name')
