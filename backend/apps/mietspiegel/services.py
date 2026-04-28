"""Mietpreisbremse calculations against the Stuttgarter Mietspiegel."""
from __future__ import annotations

from decimal import Decimal

from .models import MietspiegelEntry


def check_mietpreisbremse(
    district: str,
    size_sqm: float,
    monthly_rent_eur: Decimal,
    year_built: int | None = None,
) -> dict:
    """Return reference rent + whether the +10 % cap is exceeded."""
    qs = MietspiegelEntry.objects.filter(district__iexact=district)
    if year_built:
        qs = qs.filter(
            year_built_from__lte=year_built, year_built_to__gte=year_built
        )

    entry = qs.first()
    if not entry:
        return {"found": False}

    reference_rent = Decimal(size_sqm) * entry.avg_rent_per_sqm
    cap = reference_rent * Decimal("1.10")
    return {
        "found": True,
        "reference_rent": round(reference_rent, 2),
        "cap_with_10_percent": round(cap, 2),
        "actual_rent": monthly_rent_eur,
        "exceeds_cap": monthly_rent_eur > cap,
    }
