from django.db import models

# Create your models here.
from django.db import models
from accounts.models import User

class BloodBank(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='bloodbank')
    name = models.CharField(max_length=200)
    registration_number = models.CharField(max_length=100, unique=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    license_document = models.FileField(upload_to='licenses/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='approved')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_bloodbanks')
    approved_at = models.DateTimeField(null=True, blank=True)
    is_operational = models.BooleanField(default=True)
    operating_hours = models.CharField(max_length=100, default='24/7')
    external_id = models.CharField(max_length=6, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']

    


class DonationCamp(models.Model):
    bloodbank = models.ForeignKey(BloodBank, on_delete=models.CASCADE, related_name='camps')
    name = models.CharField(max_length=200)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    contact_number = models.CharField(max_length=15, blank=True)
    details = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.name} - {self.city}"


class CampRegistration(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('attended', 'Attended'),
    )

    camp = models.ForeignKey(DonationCamp, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='camp_registrations')
    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    blood_group = models.CharField(max_length=3)
    date_of_birth = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='approved')
    notes = models.TextField(blank=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-registered_at']
        unique_together = ('camp', 'user')  # Prevent duplicate registrations

    def __str__(self):
        return f"{self.full_name} - {self.camp.name}"