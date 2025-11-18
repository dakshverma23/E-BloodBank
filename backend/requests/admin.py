from django.contrib import admin
from .models import BloodRequest


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
