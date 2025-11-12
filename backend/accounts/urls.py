from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import UserViewSet, UserProfileViewSet, SignupView, MeView, SearchUserByEmailView
from .google_auth_views import GoogleAuthVerifyView, GoogleAuthCheckView


router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('me/', MeView.as_view(), name='me'),
    path('search-by-email/', SearchUserByEmailView.as_view(), name='search-user-by-email'),
    path('google/verify/', GoogleAuthVerifyView.as_view(), name='google-verify'),
    path('google/check/', GoogleAuthCheckView.as_view(), name='google-check'),
]

urlpatterns += router.urls


