from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models
import random
import string
from datetime import timedelta
from django.utils import timezone

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


class OTP(models.Model):
    """OTP model for email and phone verification"""
    OTP_TYPES = (
        ('email', 'Email'),
        ('phone', 'Phone'),
    )
    
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=15, null=True, blank=True)
    otp_type = models.CharField(max_length=10, choices=OTP_TYPES)
    code = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'is_verified']),
            models.Index(fields=['phone', 'is_verified']),
        ]
    
    def __str__(self):
        identifier = self.email or self.phone or 'Unknown'
        return f"{self.otp_type.upper()} OTP for {identifier} - {self.code}"
    
    @classmethod
    def generate_otp(cls, email=None, phone=None, otp_type='email', expiry_minutes=10):
        """Generate and return a new OTP instance"""
        # Validate inputs
        if otp_type == 'email' and not email:
            raise ValueError("Email is required for email OTP")
        if otp_type == 'phone' and not phone:
            raise ValueError("Phone is required for phone OTP")
        
        # Generate 6-digit OTP
        code = ''.join(random.choices(string.digits, k=6))
        
        # Invalidate any existing unverified OTPs for this email/phone
        if email:
            cls.objects.filter(email=email, is_verified=False).update(is_verified=True)
        if phone:
            cls.objects.filter(phone=phone, is_verified=False).update(is_verified=True)
        
        # Create new OTP
        otp = cls.objects.create(
            email=email,
            phone=phone,
            otp_type=otp_type,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=expiry_minutes)
        )
        
        return otp
    
    def is_valid(self):
        """Check if OTP is still valid (not expired and not verified)"""
        return not self.is_verified and timezone.now() < self.expires_at
    
    def verify(self, code):
        """Verify the OTP code"""
        if not self.is_valid():
            return False
        if self.code != code:
            return False
        self.is_verified = True
        self.save()
        return True
    
    @classmethod
    def verify_otp(cls, email=None, phone=None, code=None, otp_type='email'):
        """Verify OTP for given email or phone"""
        if not code:
            return False, "OTP code is required"
        
        try:
            if otp_type == 'email' and email:
                otp = cls.objects.filter(
                    email=email,
                    is_verified=False,
                    otp_type='email'
                ).order_by('-created_at').first()
            elif otp_type == 'phone' and phone:
                otp = cls.objects.filter(
                    phone=phone,
                    is_verified=False,
                    otp_type='phone'
                ).order_by('-created_at').first()
            else:
                return False, "Email or phone is required"
            
            if not otp:
                return False, "No OTP found. Please request a new OTP."
            
            if not otp.is_valid():
                return False, "OTP has expired. Please request a new OTP."
            
            if otp.verify(code):
                return True, "OTP verified successfully"
            else:
                return False, "Invalid OTP code"
        except Exception as e:
            return False, f"Error verifying OTP: {str(e)}"
