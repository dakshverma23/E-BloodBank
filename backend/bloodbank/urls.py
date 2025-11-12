from rest_framework.routers import DefaultRouter
from .views import BloodBankViewSet, DonationCampViewSet, CampRegistrationViewSet


router = DefaultRouter()
router.register(r'bloodbanks', BloodBankViewSet)
router.register(r'camps', DonationCampViewSet)
router.register(r'camp-registrations', CampRegistrationViewSet)

urlpatterns = router.urls


