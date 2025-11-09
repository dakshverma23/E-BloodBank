from rest_framework.routers import DefaultRouter
from .views import DonorViewSet, DonationViewSet, AppointmentViewSet


router = DefaultRouter()
router.register(r'donors', DonorViewSet)
router.register(r'donations', DonationViewSet)
router.register(r'appointments', AppointmentViewSet)

urlpatterns = router.urls


