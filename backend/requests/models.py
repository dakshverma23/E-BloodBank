from django.db import models

# Create your models here.
from django.db import models
from accounts.models import User
from bloodbank.models import BloodBank

class BloodRequest(models.Model):
    BLOOD_GROUPS = (
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
    )

    URGENCY_LEVELS = (
        ('emergency', 'Emergency'),
        ('urgent', 'Urgent'),
        ('normal', 'Normal'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('fulfilled', 'Fulfilled'),
        ('cancelled', 'Cancelled'),
    )

    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blood_requests')
    bloodbank = models.ForeignKey(BloodBank, on_delete=models.CASCADE, related_name='blood_requests', null=True, blank=True)
    patient_name = models.CharField(max_length=200)
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUPS)
    units_required = models.IntegerField()
    urgency = models.CharField(max_length=20, choices=URGENCY_LEVELS)
    required_date = models.DateField()
    hospital_name = models.CharField(max_length=200)
    doctor_name = models.CharField(max_length=200)
    contact_number = models.CharField(max_length=15)
    reason = models.TextField()
    prescription_document = models.FileField(upload_to='prescriptions/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_requests')
    approved_at = models.DateTimeField(null=True, blank=True)
    fulfilled_at = models.DateTimeField(null=True, blank=True)
    request_id = models.CharField(max_length=6, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient_name} - {self.blood_group} - {self.status}"

    class Meta:
        ordering = ['-created_at']