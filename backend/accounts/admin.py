from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional', {'fields': ('user_type', 'phone', 'is_verified')}),
    )
    list_display = ('username', 'email', 'user_type', 'phone', 'is_superuser', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'phone')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'city', 'state')
    search_fields = ('user__username', 'city', 'state')
