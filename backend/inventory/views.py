from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
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

    def create(self, request, *args, **kwargs):
        user = request.user
        # Auto-assign the current user's blood bank
        if not hasattr(user, 'bloodbank'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only blood bank users can create inventory.')
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Handle unique constraint: if inventory for this blood group exists, update it instead
        blood_group = serializer.validated_data.get('blood_group')
        units_available = serializer.validated_data.get('units_available', 0)
        min_stock_level = serializer.validated_data.get('min_stock_level', 5)
        
        inventory, created = Inventory.objects.get_or_create(
            bloodbank=user.bloodbank,
            blood_group=blood_group,
            defaults={
                'units_available': units_available,
                'min_stock_level': min_stock_level
            }
        )
        
        if not created:
            # Update existing inventory
            inventory.units_available = units_available
            inventory.min_stock_level = min_stock_level
            inventory.save()
            # Return updated inventory
            serializer = self.get_serializer(inventory)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Return created inventory
        serializer = self.get_serializer(inventory)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
