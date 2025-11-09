from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        return super().get_token(user)

    def validate(self, attrs):
        username = attrs.get('username') or ''
        if '@' in username:
            User = get_user_model()
            try:
                user_obj = User.objects.get(email=username)
                attrs = attrs.copy()
                attrs['username'] = user_obj.username
            except User.DoesNotExist:
                pass
        return super().validate(attrs)


class EmailOrUsernameTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailOrUsernameTokenObtainPairSerializer


