from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import UserViewSet, UserProfileViewSet, SignupView, MeView, SearchUserByEmailView
from .firebase_auth_views import FirebaseAuthVerifyView, FirebaseAuthCheckView
from .otp_views import SendOTPView, VerifyOTPView


router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('me/', MeView.as_view(), name='me'),
    path('search-by-email/', SearchUserByEmailView.as_view(), name='search-user-by-email'),
    path('firebase/verify/', FirebaseAuthVerifyView.as_view(), name='firebase-verify'),
    path('firebase/check/', FirebaseAuthCheckView.as_view(), name='firebase-check'),
    # OTP endpoints
    path('otp/send/', SendOTPView.as_view(), name='otp-send'),
    path('otp/verify/', VerifyOTPView.as_view(), name='otp-verify'),
]

urlpatterns += router.urls


