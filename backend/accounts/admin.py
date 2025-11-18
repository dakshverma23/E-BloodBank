from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'user_type', 'phone', 'is_verified', 'is_superuser', 'is_staff', 'is_active', 'created_at')
    list_filter = ('user_type', 'is_verified', 'is_superuser', 'is_staff', 'is_active', 'created_at')
    search_fields = ('username', 'email', 'phone')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Authentication', {
            'fields': ('username', 'password')
        }),
        ('Personal Information', {
            'fields': ('email', 'phone', 'first_name', 'last_name')
        }),
        ('Account Type', {
            'fields': ('user_type', 'is_verified', 'external_id')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important Dates', {
            'fields': ('created_at', 'updated_at', 'last_login', 'date_joined')
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'city', 'state', 'pincode')
    search_fields = ('user__username', 'city', 'state', 'pincode')
    list_filter = ('state', 'city')
