from rest_framework.routers import DefaultRouter
from .views import BloodBankViewSet, DonationCampViewSet


router = DefaultRouter()
router.register(r'bloodbanks', BloodBankViewSet)
router.register(r'camps', DonationCampViewSet)

urlpatterns = router.urls


