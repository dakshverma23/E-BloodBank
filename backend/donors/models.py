from django.db import models

# Create your models here.
from django.db import models
from accounts.models import User
from bloodbank.models import BloodBank

class Donor(models.Model):
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

    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='donor')
    full_name = models.CharField(max_length=200)
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUPS)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    phone = models.CharField(max_length=15)
    email = models.EmailField()
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    weight = models.DecimalField(max_digits=5, decimal_places=2)  # in kg
    last_donation_date = models.DateField(null=True, blank=True)
    is_eligible = models.BooleanField(default=True)
    medical_conditions = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=15)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} - {self.blood_group}"

    @property
    def age(self):
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))


class Donation(models.Model):
    donor = models.ForeignKey(Donor, on_delete=models.CASCADE, related_name='donations')
    bloodbank = models.ForeignKey(BloodBank, on_delete=models.CASCADE, related_name='donations')
    donation_date = models.DateField()
    units_donated = models.IntegerField(default=1)
    hemoglobin_level = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    blood_pressure = models.CharField(max_length=20, null=True, blank=True)
    notes = models.TextField(blank=True)
    verified_by = models.CharField(max_length=200)
    tx_id = models.CharField(max_length=6, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.donor.full_name} - {self.donation_date}"

    class Meta:
        ordering = ['-donation_date']


class Appointment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    bloodbank = models.ForeignKey(BloodBank, on_delete=models.CASCADE, related_name='appointments')
    appointment_date = models.DateField()
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} -> {self.bloodbank.name} on {self.appointment_date}"
    
    class Meta:
        ordering = ['-appointment_date', '-created_at']