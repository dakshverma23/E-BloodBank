from rest_framework import viewsets, permissions
from .models import BloodRequest
from .serializers import BloodRequestSerializer


class BloodRequestViewSet(viewsets.ModelViewSet):
    queryset = BloodRequest.objects.all().order_by('-created_at')
    serializer_class = BloodRequestSerializer
    filterset_fields = ['bloodbank', 'blood_group', 'urgency', 'status']
    search_fields = ['patient_name', 'hospital_name', 'doctor_name', 'bloodbank__name']
    ordering_fields = ['created_at', 'required_date']

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Donors see their own requests; bloodbanks see requests to them
        if hasattr(user, 'bloodbank'):
            from django.db.models import Q
            return qs.filter(Q(bloodbank=user.bloodbank) | Q(bloodbank__isnull=True))
        return qs.filter(requester=user)

    def perform_create(self, serializer):
        # Only donors/receivers can create requests, not blood banks
        user = self.request.user
        if hasattr(user, 'bloodbank'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Blood banks cannot create blood requests.')
        serializer.save(requester=user)
