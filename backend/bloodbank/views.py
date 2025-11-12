from rest_framework import viewsets, permissions, decorators, response, status
from .models import BloodBank, DonationCamp, CampRegistration
from .serializers import BloodBankSerializer, DonationCampSerializer, CampRegistrationSerializer
from django.db import transaction


class BloodBankViewSet(viewsets.ModelViewSet):
    queryset = BloodBank.objects.all().order_by('-created_at')
    serializer_class = BloodBankSerializer
    filterset_fields = ['city', 'state', 'status', 'is_operational']
    search_fields = ['name', 'registration_number', 'city', 'state']
    ordering_fields = ['created_at', 'name']

    def list(self, request, *args, **kwargs):
        # Ensure every bloodbank user has an associated BloodBank record
        from accounts.models import User
        with transaction.atomic():
            bank_users = User.objects.filter(user_type='bloodbank')
            existing_user_ids = set(BloodBank.objects.filter(user__in=bank_users).values_list('user_id', flat=True))
            to_create = bank_users.exclude(id__in=existing_user_ids)
            for u in to_create:
                BloodBank.objects.create(
                    user=u,
                    name=u.username,
                    registration_number=f"REG-{u.id}",
                    email=u.email or '',
                    phone=u.phone or '',
                    address='', city='', state='', pincode=''
                )
        return super().list(request, *args, **kwargs)

    @decorators.action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_inventory(self, request):
        # Return inventory rows for the current user's bloodbank
        if not hasattr(request.user, 'bloodbank'):
            return response.Response({'detail': 'Not a bloodbank user'}, status=403)
        bb = request.user.bloodbank
        inv = bb.inventory.all()
        from inventory.serializers import InventorySerializer
        return response.Response(InventorySerializer(inv, many=True).data)


class DonationCampViewSet(viewsets.ModelViewSet):
    queryset = DonationCamp.objects.all().order_by('-start_date')
    serializer_class = DonationCampSerializer
    filterset_fields = ['city']
    search_fields = ['name', 'city']
    ordering_fields = ['start_date']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        # Bloodbank users see their own camps by default on list if ?mine=true
        mine = self.request.query_params.get('mine')
        if mine and hasattr(self.request.user, 'bloodbank'):
            return qs.filter(bloodbank=self.request.user.bloodbank)
        return qs

    def perform_create(self, serializer):
        # Force the camp to the current bloodbank user
        user = self.request.user
        if not hasattr(user, 'bloodbank'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only bloodbank users can create camps')
        serializer.save(bloodbank=user.bloodbank)


class CampRegistrationViewSet(viewsets.ModelViewSet):
    queryset = CampRegistration.objects.all().order_by('-registered_at')
    serializer_class = CampRegistrationSerializer
    filterset_fields = ['camp', 'status', 'blood_group']
    search_fields = ['full_name', 'email', 'phone', 'camp__name']
    ordering_fields = ['registered_at', 'full_name']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # Blood bank users see registrations for their camps
        if hasattr(user, 'bloodbank'):
            camp_id = self.request.query_params.get('camp')
            if camp_id:
                return qs.filter(camp_id=camp_id, camp__bloodbank=user.bloodbank)
            return qs.filter(camp__bloodbank=user.bloodbank)
        
        # Donor users see their own registrations
        return qs.filter(user=user)

    def perform_create(self, serializer):
        user = self.request.user
        # Auto-assign user and fill in details from user profile if available
        data = serializer.validated_data.copy()
        
        # Try to get user profile data
        if hasattr(user, 'profile'):
            profile = user.profile
            if not data.get('full_name'):
                data['full_name'] = user.get_full_name() or user.username
            if not data.get('email'):
                data['email'] = user.email
            if not data.get('phone'):
                data['phone'] = user.phone or getattr(profile, 'phone', '')
        
        # Try to get donor data
        if hasattr(user, 'donor'):
            donor = user.donor
            if not data.get('full_name'):
                data['full_name'] = donor.full_name
            if not data.get('email'):
                data['email'] = donor.email
            if not data.get('phone'):
                data['phone'] = donor.phone
            if not data.get('blood_group'):
                data['blood_group'] = donor.blood_group
            if not data.get('date_of_birth'):
                data['date_of_birth'] = donor.date_of_birth
        
        # Fallback to user data
        if not data.get('full_name'):
            data['full_name'] = user.get_full_name() or user.username
        if not data.get('email'):
            data['email'] = user.email or ''
        if not data.get('phone'):
            data['phone'] = user.phone or ''
        
        serializer.save(user=user, **data)
