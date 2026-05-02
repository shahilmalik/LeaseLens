from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.mietspiegel.models import MietspiegelEntry

User = get_user_model()


class MietspiegelTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="mietuser", password="securepass123"
        )
        self.client.force_authenticate(user=self.user)
        MietspiegelEntry.objects.create(
            district="Mitte",
            year_built_from=1990,
            year_built_to=2005,
            size_from_sqm=30,
            size_to_sqm=80,
            avg_rent_per_sqm=Decimal("12.50"),
        )

    def test_list_mietspiegel_entries(self):
        """Authenticated users can list Mietspiegel entries."""
        res = self.client.get("/api/v1/mietspiegel/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_mietspiegel_requires_auth(self):
        """Unauthenticated request returns 401."""
        self.client.force_authenticate(user=None)
        res = self.client.get("/api/v1/mietspiegel/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class MietpreisbremseCheckTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="checkuser", password="securepass123"
        )
        self.client.force_authenticate(user=self.user)
        MietspiegelEntry.objects.create(
            district="Mitte",
            year_built_from=1990,
            year_built_to=2005,
            avg_rent_per_sqm=Decimal("12.50"),
        )

    def test_fair_rent_check(self):
        """Rent within 10% of reference is not flagged."""
        res = self.client.post("/api/v1/mietspiegel/check/", {
            "district": "Mitte",
            "size_sqm": 50,
            "monthly_rent_eur": "600.00",  # 12 €/m² — under 12.50 * 1.10 = 13.75
            "year_built": 2000,
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["found"])
        self.assertFalse(res.data["exceeds_cap"])

    def test_excessive_rent_flagged(self):
        """Rent exceeding the 10% cap is flagged."""
        res = self.client.post("/api/v1/mietspiegel/check/", {
            "district": "Mitte",
            "size_sqm": 50,
            "monthly_rent_eur": "800.00",  # 16 €/m² — well above cap
            "year_built": 2000,
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["exceeds_cap"])

    def test_unknown_district_returns_not_found(self):
        """Checking an unknown district returns found=False."""
        res = self.client.post("/api/v1/mietspiegel/check/", {
            "district": "UnknownDistrict",
            "size_sqm": 50,
            "monthly_rent_eur": "600.00",
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data["found"])

    def test_check_requires_auth(self):
        """Unauthenticated check returns 401."""
        self.client.force_authenticate(user=None)
        res = self.client.post("/api/v1/mietspiegel/check/", {
            "district": "Mitte",
            "size_sqm": 50,
            "monthly_rent_eur": "600.00",
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_required_fields(self):
        """Missing required fields returns 400."""
        res = self.client.post("/api/v1/mietspiegel/check/", {
            "district": "Mitte",
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
