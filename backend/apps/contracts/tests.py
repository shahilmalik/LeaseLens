import io

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Profile
from apps.contracts.models import Clause, Contract

User = get_user_model()


def make_pdf() -> SimpleUploadedFile:
    """Return a minimal valid-looking PDF upload."""
    content = b"%PDF-1.4 fake pdf content for testing"
    return SimpleUploadedFile("test_contract.pdf", content, content_type="application/pdf")


class ContractUploadTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="contractuser", password="securepass123"
        )
        Profile.objects.get_or_create(user=self.user)
        self.client.force_authenticate(user=self.user)

    def test_upload_contract(self):
        """Uploading a PDF creates a Contract record."""
        res = self.client.post("/api/v1/contracts/", {"file": make_pdf()}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Contract.objects.filter(user=self.user).count(), 1)

    def test_contract_filename_saved(self):
        """The original filename is stored on the contract."""
        self.client.post("/api/v1/contracts/", {"file": make_pdf()}, format="multipart")
        contract = Contract.objects.get(user=self.user)
        self.assertEqual(contract.original_filename, "test_contract.pdf")

    def test_list_contracts_only_own(self):
        """Users can only see their own contracts."""
        other = User.objects.create_user(username="other", password="securepass123")
        Contract.objects.create(user=other, original_filename="other.pdf")
        self.client.post("/api/v1/contracts/", {"file": make_pdf()}, format="multipart")
        res = self.client.get("/api/v1/contracts/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["original_filename"], "test_contract.pdf")

    def test_contracts_require_auth(self):
        """Unauthenticated contract list returns 401."""
        self.client.force_authenticate(user=None)
        res = self.client.get("/api/v1/contracts/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_contract(self):
        """A user can delete their own contract."""
        self.client.post("/api/v1/contracts/", {"file": make_pdf()}, format="multipart")
        contract = Contract.objects.get(user=self.user)
        res = self.client.delete(f"/api/v1/contracts/{contract.id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Contract.objects.filter(user=self.user).count(), 0)

    def test_cannot_delete_other_users_contract(self):
        """A user cannot delete another user's contract."""
        other = User.objects.create_user(username="other2", password="securepass123")
        contract = Contract.objects.create(user=other, original_filename="other.pdf")
        res = self.client.delete(f"/api/v1/contracts/{contract.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class ContractScanTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="scanuser", password="securepass123"
        )
        Profile.objects.get_or_create(user=self.user)
        self.client.force_authenticate(user=self.user)
        self.contract = Contract.objects.create(
            user=self.user,
            original_filename="lease.pdf",
            extracted_text="§ 12 Der Mieter ist verpflichtet, Schönheitsreparaturen durchzuführen.",
        )

    def test_scan_returns_clauses(self):
        """Scanning a contract returns clauses and a score."""
        res = self.client.post(f"/api/v1/contracts/{self.contract.id}/scan/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("score", res.data)
        self.assertIn("clauses", res.data)
        self.assertGreater(res.data["count"], 0)

    def test_clauses_endpoint_returns_list(self):
        """GET /contracts/{id}/clauses/ returns a list."""
        Clause.objects.create(
            contract=self.contract,
            section="§ 12",
            category="Cosmetic repairs",
            severity="red",
            original_text="Schönheitsreparaturen",
            explanation_en="Likely void clause.",
            explanation_de="Wahrscheinlich unwirksame Klausel.",
            recommendation_en="You are not obliged to repaint.",
            recommendation_de="Du bist nicht verpflichtet zu streichen.",
        )
        res = self.client.get(f"/api/v1/contracts/{self.contract.id}/clauses/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["severity"], "red")

    def test_download_report_without_scan_returns_404(self):
        """Downloading a report before scanning returns 404."""
        res = self.client.get(f"/api/v1/contracts/{self.contract.id}/download-report/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
