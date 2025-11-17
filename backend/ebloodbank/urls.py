"""
URL configuration for ebloodbank project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.urls import path, include
from django.template.response import TemplateResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.auth import EmailOrUsernameTokenObtainPairView

# Customize admin site
admin.site.site_header = "E-BloodBank Administration"
admin.site.site_title = "E-BloodBank Admin"
admin.site.index_title = "Blood Bank Management System"
admin.site.site_url = "/"

def index(_request):
    return JsonResponse({
        'status': 'ok',
        'app': 'ebloodbank',
        'message': 'Welcome to E-BloodBank API. Visit /admin/ or /health/.',
    })

def health(_request):
    return JsonResponse({'status': 'healthy'})

urlpatterns = [
    path('', index, name='index'),
    path('health/', health, name='health'),
    path('admin/', admin.site.urls),
    # API routes
    path('api/accounts/', include('accounts.urls')),
    path('api/bloodbank/', include('bloodbank.urls')),
    path('api/donors/', include('donors.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/requests/', include('requests.urls')),
    # JWT auth
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/by-username-or-email/', EmailOrUsernameTokenObtainPairView.as_view(), name='token_by_username_or_email'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
