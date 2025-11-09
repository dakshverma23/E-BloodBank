from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from bloodbank.models import BloodBank
from .models import User, UserProfile
from .serializers import UserSerializer, UserProfileSerializer, MeSerializer


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
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
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
