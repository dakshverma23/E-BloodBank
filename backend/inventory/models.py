from django.db import models

# Create your models here.
from django.db import models
from bloodbank.models import BloodBank

class Inventory(models.Model):
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

    bloodbank = models.ForeignKey(BloodBank, on_delete=models.CASCADE, related_name='inventory')
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUPS)
    units_available = models.IntegerField(default=0)
    min_stock_level = models.IntegerField(default=5)
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('bloodbank', 'blood_group')
        ordering = ['blood_group']

    def __str__(self):
        return f"{self.bloodbank.name} - {self.blood_group}: {self.units_available} units"

    @property
    def is_low_stock(self):
        return self.units_available <= self.min_stock_level