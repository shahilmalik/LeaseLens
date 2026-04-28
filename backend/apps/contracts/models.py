from django.conf import settings
from django.db import models


class Contract(models.Model):
    """A rental contract uploaded by a user."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="contracts",
    )
    file = models.FileField(upload_to="contracts/")
    original_filename = models.CharField(max_length=255, blank=True)
    extracted_text = models.TextField(blank=True)
    score = models.IntegerField(null=True, blank=True)
    report_pdf = models.FileField(upload_to="reports/", null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Contract<{self.user_id}:{self.original_filename}>"


class Clause(models.Model):
    """A clause detected by the Clause Scanner."""

    SEVERITY_CHOICES = [
        ("green", "Unproblematic"),
        ("yellow", "Pay attention"),
        ("red", "Critical"),
    ]

    contract = models.ForeignKey(
        Contract, on_delete=models.CASCADE, related_name="clauses"
    )
    section = models.CharField(max_length=50, blank=True)
    category = models.CharField(max_length=100)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    original_text = models.TextField()
    explanation_en = models.TextField(blank=True)
    explanation_de = models.TextField(blank=True)
    recommendation_en = models.TextField(blank=True)
    recommendation_de = models.TextField(blank=True)
