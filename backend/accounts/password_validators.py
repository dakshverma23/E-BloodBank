"""
Custom password validators for E-BloodBank
"""
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class UppercaseValidator:
    """
    Validate that the password contains at least one uppercase letter.
    """
    def validate(self, password, user=None):
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("This password must contain at least one uppercase letter."),
                code='password_no_upper',
            )

    def get_help_text(self):
        return _("Your password must contain at least one uppercase letter.")


class LowercaseValidator:
    """
    Validate that the password contains at least one lowercase letter.
    """
    def validate(self, password, user=None):
        if not re.search(r'[a-z]', password):
            raise ValidationError(
                _("This password must contain at least one lowercase letter."),
                code='password_no_lower',
            )

    def get_help_text(self):
        return _("Your password must contain at least one lowercase letter.")


class NumericValidator:
    """
    Validate that the password contains at least one numeric character.
    """
    def validate(self, password, user=None):
        if not re.search(r'[0-9]', password):
            raise ValidationError(
                _("This password must contain at least one numeric character."),
                code='password_no_numeric',
            )

    def get_help_text(self):
        return _("Your password must contain at least one numeric character.")


class SpecialCharacterValidator:
    """
    Validate that the password contains at least one special character.
    """
    def validate(self, password, user=None):
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
            raise ValidationError(
                _("This password must contain at least one special character."),
                code='password_no_special',
            )

    def get_help_text(self):
        return _("Your password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>/?).")


class MaximumLengthValidator:
    """
    Validate that the password is not longer than the maximum length.
    """
    def __init__(self, max_length=4096):
        self.max_length = max_length

    def validate(self, password, user=None):
        if len(password) > self.max_length:
            raise ValidationError(
                _("This password is too long. It must contain no more than %(max_length)d characters."),
                code='password_too_long',
                params={'max_length': self.max_length},
            )

    def get_help_text(self):
        return _("Your password must contain no more than %(max_length)d characters." % {'max_length': self.max_length})

