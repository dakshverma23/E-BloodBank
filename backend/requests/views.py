from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
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
        # Donors see their own requests; bloodbanks see ALL requests (approved, rejected, pending)
        if hasattr(user, 'bloodbank'):
            # Blood banks can see all requests - no filtering needed
            return qs
        return qs.filter(requester=user)

    def perform_create(self, serializer):
        # Only donors/receivers can create requests, not blood banks
        user = self.request.user
        if hasattr(user, 'bloodbank'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Blood banks cannot create blood requests.')
        serializer.save(requester=user)

    def update(self, request, *args, **kwargs):
        # Allow blood banks to update status
        instance = self.get_object()
        user = request.user
        
        if hasattr(user, 'bloodbank'):
            # Blood bank can update status and assign to themselves
            if 'status' in request.data:
                new_status = request.data['status']
                if new_status in ['approved', 'rejected']:
                    instance.status = new_status
                    instance.approved_by = user
                    instance.approved_at = timezone.now()
                    if not instance.bloodbank:
                        instance.bloodbank = user.bloodbank
                    instance.save()
                    serializer = self.get_serializer(instance)
                    return Response(serializer.data)
        
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a blood request (blood bank only)
        - Can approve pending requests
        - Can approve rejected requests (override rejection)
        - Cannot approve already approved requests
        """
        request_obj = self.get_object()
        user = request.user
        
        if not hasattr(user, 'bloodbank'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only blood banks can approve requests.')
        
        # Cannot approve if already approved by another blood bank
        if request_obj.status == 'approved':
            return Response(
                {'error': 'Request is already approved by another blood bank and cannot be changed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Can approve pending or rejected requests
        if request_obj.status not in ['pending', 'rejected']:
            return Response(
                {'error': f'Cannot approve request with status: {request_obj.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        request_obj.status = 'approved'
        request_obj.approved_by = user
        request_obj.approved_at = timezone.now()
        # Update bloodbank to current blood bank (even if it was rejected by another bank)
        request_obj.bloodbank = user.bloodbank
        request_obj.save()
        
        serializer = self.get_serializer(request_obj)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a blood request (blood bank only)
        - Can only reject pending requests
        - Cannot reject approved requests (already approved by another bank)
        - Cannot reject already rejected requests (use approve to override rejection)
        """
        request_obj = self.get_object()
        user = request.user
        
        if not hasattr(user, 'bloodbank'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only blood banks can reject requests.')
        
        # Cannot reject if already approved by another blood bank
        if request_obj.status == 'approved':
            return Response(
                {'error': 'Request is already approved by another blood bank and cannot be rejected.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Can only reject pending requests
        if request_obj.status != 'pending':
            return Response(
                {'error': f'Can only reject pending requests. Current status: {request_obj.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        request_obj.status = 'rejected'
        request_obj.approved_by = user
        request_obj.approved_at = timezone.now()
        # Set bloodbank to current blood bank
        request_obj.bloodbank = user.bloodbank
        request_obj.save()
        
        serializer = self.get_serializer(request_obj)
        return Response(serializer.data)
