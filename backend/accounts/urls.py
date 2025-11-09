from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import UserViewSet, UserProfileViewSet, SignupView, MeView


router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('me/', MeView.as_view(), name='me'),
]

urlpatterns += router.urls


