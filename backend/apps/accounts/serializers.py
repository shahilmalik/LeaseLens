from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Profile

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["language", "gemini_api_key"]


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "profile"]
        read_only_fields = ["id"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    language = serializers.ChoiceField(
        choices=Profile.LANGUAGE_CHOICES, default="en", required=False
    )
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "language", "first_name", "last_name"]

    def create(self, validated_data):
        language = validated_data.pop("language", "en")
        user = User.objects.create_user(**validated_data)
        Profile.objects.create(user=user, language=language)
        return user
