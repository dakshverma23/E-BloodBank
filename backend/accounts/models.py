from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    USER_TYPES = (
        ('donor', 'Donor/Receiver'),
        ('bloodbank', 'Blood Bank'),
        ('admin', 'Admin'),
    )
    user_type = models.CharField(max_length=20, choices=USER_TYPES)
    phone = models.CharField(max_length=15, unique=True)
    is_verified = models.BooleanField(default=False)
    external_id = models.CharField(max_length=6, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Ensure createsuperuser prompts for these and validations apply
    REQUIRED_FIELDS = ['email', 'phone', 'user_type']

    def __str__(self):
        return f"{self.username} - {self.user_type}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    pincode = models.CharField(max_length=10, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)

    def __str__(self):
        return f"Profile - {self.user.username}"