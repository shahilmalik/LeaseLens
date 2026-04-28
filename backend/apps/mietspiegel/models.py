from django.db import models


class MietspiegelEntry(models.Model):
    """Reference rent values from the Stuttgarter Mietspiegel."""

    district = models.CharField(max_length=100)
    year_built_from = models.PositiveIntegerField(null=True, blank=True)
    year_built_to = models.PositiveIntegerField(null=True, blank=True)
    size_from_sqm = models.FloatField(null=True, blank=True)
    size_to_sqm = models.FloatField(null=True, blank=True)
    avg_rent_per_sqm = models.DecimalField(max_digits=6, decimal_places=2)

    def __str__(self) -> str:
        return f"{self.district} – {self.avg_rent_per_sqm} €/m²"
