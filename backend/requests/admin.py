from django.contrib import admin
from .models import BloodRequest


@admin.register(BloodRequest)
class BloodRequestAdmin(admin.ModelAdmin):
    list_display = ('patient_name', 'blood_group', 'status', 'urgency', 'bloodbank')
    search_fields = ('patient_name', 'blood_group', 'status', 'bloodbank__name')
