from django.contrib.auth import get_user_model
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Profile
from .serializers import ProfileSerializer, RegisterSerializer, UserSerializer

User = get_user_model()


class AuthViewSet(viewsets.ViewSet):
    """Register + fetch the current user."""

    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=["post"], url_path="register")
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(
        detail=False,
        methods=["get"],
        url_path="me",
        permission_classes=[permissions.IsAuthenticated],
    )
    def me(self, request):
        return Response(UserSerializer(request.user).data)


class ProfileViewSet(viewsets.ViewSet):
    """GET/PATCH the current user's profile at /profile/ (no pk needed)."""

    permission_classes = [permissions.IsAuthenticated]

    def _get_profile(self, user):
        profile, _ = Profile.objects.get_or_create(user=user)
        return profile

    @action(detail=False, methods=["get", "patch"], url_path="", url_name="me")
    def me(self, request):
        profile = self._get_profile(request.user)
        if request.method == "PATCH":
            serializer = ProfileSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        return Response(ProfileSerializer(profile).data)
