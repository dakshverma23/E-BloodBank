from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, UserProfile
from bloodbank.models import BloodBank
from donors.models import Donation
from requests.models import BloodRequest
import random
import string


@receiver(post_save, sender=User)
def create_user_profile(sender, instance: User, created: bool, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)


def _gen_code(k=6):
    return ''.join(random.choices(string.digits, k=k))


@receiver(post_save, sender=User)
def assign_user_external_id(sender, instance: User, created: bool, **kwargs):
    if instance.is_superuser:
        return
    if not instance.external_id:
        code = _gen_code()
        while User.objects.filter(external_id=code).exists():
            code = _gen_code()
        User.objects.filter(pk=instance.pk).update(external_id=code)


@receiver(post_save, sender=BloodBank)
def assign_bloodbank_external_id(sender, instance: BloodBank, created: bool, **kwargs):
    if not instance.external_id:
        code = _gen_code()
        while BloodBank.objects.filter(external_id=code).exists():
            code = _gen_code()
        BloodBank.objects.filter(pk=instance.pk).update(external_id=code)


@receiver(post_save, sender=Donation)
def assign_donation_tx_id(sender, instance: Donation, created: bool, **kwargs):
    if not instance.tx_id:
        code = _gen_code()
        while Donation.objects.filter(tx_id=code).exists():
            code = _gen_code()
        Donation.objects.filter(pk=instance.pk).update(tx_id=code)


@receiver(post_save, sender=BloodRequest)
def assign_bloodrequest_request_id(sender, instance: BloodRequest, created: bool, **kwargs):
    if not instance.request_id:
        code = _gen_code()
        while BloodRequest.objects.filter(request_id=code).exists():
            code = _gen_code()
        BloodRequest.objects.filter(pk=instance.pk).update(request_id=code)


