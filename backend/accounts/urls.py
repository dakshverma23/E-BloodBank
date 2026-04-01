from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import UserViewSet, UserProfileViewSet, SignupView, MeView, SearchUserByEmailView
from .otp_views import SendOTPView, VerifyOTPView


router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('me/', MeView.as_view(), name='me'),
    path('search-by-email/', SearchUserByEmailView.as_view(), name='search-user-by-email'),
    # OTP endpoints
    path('otp/send/', SendOTPView.as_view(), name='otp-send'),
    path('otp/verify/', VerifyOTPView.as_view(), name='otp-verify'),
]

urlpatterns += router.urls


