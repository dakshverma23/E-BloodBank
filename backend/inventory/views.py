from rest_framework import viewsets, permissions
from .models import Inventory
from .serializers import InventorySerializer


class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all().order_by('blood_group')
    serializer_class = InventorySerializer
    filterset_fields = ['bloodbank', 'blood_group']
    search_fields = ['bloodbank__name', 'blood_group']
    ordering_fields = ['units_available', 'blood_group', 'last_updated']

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = getattr(self.request, 'user', None)
        # Blood bank users see only their own inventory; others can read all
        if user and hasattr(user, 'bloodbank'):
            return qs.filter(bloodbank=user.bloodbank)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        # Auto-assign the current user's blood bank
        if not hasattr(user, 'bloodbank'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only blood bank users can create inventory.')
        serializer.save(bloodbank=user.bloodbank)
