from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Profile

User = get_user_model()


class RegistrationTests(APITestCase):
    def test_register_creates_user_and_profile(self):
        """Registering a new user also creates a Profile with default language."""
        res = self.client.post("/api/v1/auth/register/", {
            "username": "testuser",
            "email": "test@example.com",
            "password": "securepass123",
            "language": "en",
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="testuser")
        self.assertTrue(hasattr(user, "profile"))
        self.assertEqual(user.profile.language, "en")

    def test_register_with_german_language(self):
        """Language preference is saved correctly during registration."""
        self.client.post("/api/v1/auth/register/", {
            "username": "germanuser",
            "email": "de@example.com",
            "password": "securepass123",
            "language": "de",
        })
        user = User.objects.get(username="germanuser")
        self.assertEqual(user.profile.language, "de")

    def test_register_duplicate_username_fails(self):
        """Registering with an existing username returns 400."""
        User.objects.create_user(username="taken", password="pass12345")
        res = self.client.post("/api/v1/auth/register/", {
            "username": "taken",
            "email": "new@example.com",
            "password": "securepass123",
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_short_password_fails(self):
        """Passwords shorter than 8 characters are rejected."""
        res = self.client.post("/api/v1/auth/register/", {
            "username": "newuser",
            "email": "new@example.com",
            "password": "short",
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class AuthTokenTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="tokenuser", password="securepass123"
        )

    def test_obtain_token(self):
        """Valid credentials return access and refresh tokens."""
        res = self.client.post("/api/v1/token/", {
            "username": "tokenuser",
            "password": "securepass123",
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

    def test_wrong_password_fails(self):
        """Wrong password returns 401."""
        res = self.client.post("/api/v1/token/", {
            "username": "tokenuser",
            "password": "wrongpassword",
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_endpoint_requires_auth(self):
        """Unauthenticated request to /auth/me/ returns 401."""
        res = self.client.get("/api/v1/auth/me/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_endpoint_returns_user(self):
        """Authenticated request to /auth/me/ returns the current user."""
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/v1/auth/me/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["username"], "tokenuser")


class ProfileTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="profileuser", password="securepass123"
        )
        Profile.objects.get_or_create(user=self.user)
        self.client.force_authenticate(user=self.user)

    def test_get_profile(self):
        """GET /profile/ returns the current user's profile."""
        res = self.client.get("/api/v1/profile/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("language", res.data)

    def test_patch_language(self):
        """PATCH /profile/ updates the language field."""
        res = self.client.patch("/api/v1/profile/", {"language": "de"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.language, "de")

    def test_profile_requires_auth(self):
        """Unauthenticated profile request returns 401."""
        self.client.force_authenticate(user=None)
        res = self.client.get("/api/v1/profile/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
