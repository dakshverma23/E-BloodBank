from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from bloodbank.models import BloodBank
from .models import User, UserProfile
from .serializers import UserSerializer, UserProfileSerializer, MeSerializer
from .google_auth import is_google_verified, clear_google_verification


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all().order_by('-id')
    serializer_class = UserProfileSerializer


class SignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Check if email is verified via Google OAuth
        email = request.data.get('email')
        phone = request.data.get('phone')
        
        # Check if email is verified via Google OAuth
        if email:
            email_normalized = email.strip().lower()
            if not is_google_verified(email_normalized):
                return Response(
                    {'email': ['Email must be verified via Google OAuth before signup. Please sign in with Google first.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create a mutable copy of request data
        data = request.data.copy()
        
        # Check if phone is already registered and validate format
        if phone:
            phone_normalized = ''.join(filter(str.isdigit, phone.strip()))
            if len(phone_normalized) != 10:
                return Response(
                    {'phone': ['Phone number must be exactly 10 digits']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if User.objects.filter(phone=phone_normalized).exists():
                return Response(
                    {'phone': ['This phone number is already registered. Please use a different phone number.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Update request data with normalized phone
            data['phone'] = phone_normalized
        
        # Validate and create user
        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            # Mark user as verified since email is verified via Google
            user.is_verified = True
            user.save()
            
            # Clear Google verification after successful signup
            if email:
                clear_google_verification(email)
            
            # If donor user, create linked Donor profile and UserProfile
            if user.user_type == 'donor':
                from donors.models import Donor
                from accounts.models import UserProfile
                from datetime import date
                from django.utils.dateparse import parse_date
                
                # Update or create UserProfile
                profile, _ = UserProfile.objects.get_or_create(user=user, defaults={
                    'date_of_birth': parse_date(request.data.get('date_of_birth')) if request.data.get('date_of_birth') else None,
                    'address': request.data.get('address') or '',
                    'city': request.data.get('city') or '',
                    'state': request.data.get('state') or '',
                    'pincode': request.data.get('pincode') or '',
                })
                # Update profile if data provided
                if request.data.get('date_of_birth'):
                    profile.date_of_birth = parse_date(request.data.get('date_of_birth'))
                if request.data.get('address'):
                    profile.address = request.data.get('address')
                if request.data.get('city'):
                    profile.city = request.data.get('city')
                if request.data.get('state'):
                    profile.state = request.data.get('state')
                if request.data.get('pincode'):
                    profile.pincode = request.data.get('pincode')
                profile.save()
                
                # Create Donor profile
                donor_date_of_birth = parse_date(request.data.get('date_of_birth')) if request.data.get('date_of_birth') else date(2000, 1, 1)
                emergency_contact = request.data.get('emergency_contact') or user.phone
                # Normalize emergency contact to 10 digits
                emergency_contact_digits = ''.join(filter(str.isdigit, str(emergency_contact)))
                if len(emergency_contact_digits) != 10:
                    emergency_contact_digits = user.phone
                
                donor_payload = {
                    'user': user,
                    'full_name': request.data.get('full_name') or user.username,
                    'blood_group': request.data.get('blood_group') or 'O+',
                    'date_of_birth': donor_date_of_birth,
                    'gender': request.data.get('gender') or 'M',
                    'phone': user.phone,
                    'email': user.email,
                    'address': request.data.get('address') or 'Not provided',
                    'city': request.data.get('city') or 'Not provided',
                    'state': request.data.get('state') or 'Not provided',
                    'pincode': request.data.get('pincode') or '000000',
                    'weight': float(request.data.get('weight')) if request.data.get('weight') else 70.0,
                    'emergency_contact': emergency_contact_digits,
                    'medical_conditions': request.data.get('medical_conditions') or '',
                }
                Donor.objects.get_or_create(user=user, defaults=donor_payload)
            
            # If bloodbank user, create linked BloodBank profile if fields provided
            if user.user_type == 'bloodbank':
                bb_payload = {
                    'user': user,
                    'name': request.data.get('bb_name') or user.username,
                    'registration_number': request.data.get('bb_registration_number') or f"REG-{user.id}",
                    'email': request.data.get('bb_email') or user.email,
                    'phone': request.data.get('bb_phone') or user.phone,
                    'address': request.data.get('bb_address') or '',
                    'city': request.data.get('bb_city') or '',
                    'state': request.data.get('bb_state') or '',
                    'pincode': request.data.get('bb_pincode') or '',
                    'latitude': request.data.get('bb_latitude') or None,
                    'longitude': request.data.get('bb_longitude') or None,
                }
                BloodBank.objects.get_or_create(user=user, defaults=bb_payload)
            # Auto-login return tokens to simplify frontend
            refresh = RefreshToken.for_user(user)
            data = UserSerializer(user).data
            data.update({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })
            return Response(data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class SearchUserByEmailView(APIView):
    """
    Search user by email and return user details with profile and donor info
    Used by blood banks to find donor information when creating donations
    Also used during signup to check if user exists and pre-fill data
    """
    permission_classes = [permissions.AllowAny]  # Allow anonymous access for signup flow
    
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {'error': f'User with email {email} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except User.MultipleObjectsReturned:
            # Should not happen if email is unique, but handle it
            user = User.objects.filter(email__iexact=email).first()
        
        # Get user profile
        profile = None
        try:
            profile = user.profile
        except:
            pass
        
        # Get donor profile if exists
        donor = None
        donor_data = None
        try:
            donor = user.donor
            from donors.serializers import DonorSerializer
            donor_data = DonorSerializer(donor).data
        except:
            pass
        
        # Prepare response data
        response_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'phone': user.phone,
            'user_type': user.user_type,
            'external_id': user.external_id,
            'profile': None,
            'donor': None,
        }
        
        if profile:
            from .serializers import UserProfileSerializer
            response_data['profile'] = UserProfileSerializer(profile).data
        
        if donor_data:
            response_data['donor'] = donor_data
        
        return Response(response_data, status=status.HTTP_200_OK)
