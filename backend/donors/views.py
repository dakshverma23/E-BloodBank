from rest_framework import viewsets, permissions
from .models import Donor, Donation, Appointment
from .serializers import DonorSerializer, DonationSerializer, AppointmentSerializer


class DonorViewSet(viewsets.ModelViewSet):
    queryset = Donor.objects.all().order_by('-created_at')
    serializer_class = DonorSerializer
    # Remove 'user' from filterset_fields since we handle it manually
    filterset_fields = ['blood_group', 'city', 'state', 'is_eligible']
    # Support search by exact numeric id and fuzzy text fields
    search_fields = ['=id', 'full_name', 'city', 'state', 'blood_group', 'email', 'phone']
    ordering_fields = ['created_at', 'full_name']

    def get_queryset(self):
        qs = super().get_queryset()
        # Handle user filter manually before filterset processing
        user_id = self.request.query_params.get('user')
        if user_id is not None:
            try:
                uid = int(user_id)
                qs = qs.filter(user_id=uid)
            except (ValueError, TypeError):
                # Return empty queryset for invalid user id instead of 400
                return qs.none()
        return qs


class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.all().order_by('-donation_date')
    serializer_class = DonationSerializer
    filterset_fields = ['donor', 'bloodbank', 'donation_date']
    search_fields = ['donor__full_name', 'bloodbank__name']
    ordering_fields = ['donation_date', 'units_donated']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Blood bank users see only their donations
        if hasattr(user, 'bloodbank'):
            return qs.filter(bloodbank=user.bloodbank)
        # Donor users see their own donations
        if hasattr(user, 'donor'):
            return qs.filter(donor=user.donor)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        # Only blood bank users can create donation records, and their bank is auto-assigned
        if not hasattr(user, 'bloodbank'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only blood bank users can add donations.')
        serializer.save(bloodbank=user.bloodbank)


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().order_by('-appointment_date')
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Donors see their appointments; bloodbanks see appointments to their bank
        if hasattr(user, 'bloodbank'):
            return qs.filter(bloodbank=user.bloodbank)
        return qs.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
