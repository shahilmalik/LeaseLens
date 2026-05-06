from django.conf import settings
from django.db import models


class Profile(models.Model):
    """Extra per-user data: preferred UI language."""

    LANGUAGE_CHOICES = [
        ("en", "English"),
        ("de", "German"),
        ("tr", "Turkish"),
        ("ru", "Russian"),
        ("pl", "Polish"),
        ("ar", "Arabic"),
        ("ku", "Kurdish"),
        ("sr", "Serbo-Croatian"),
        ("ro", "Romanian"),
        ("it", "Italian"),
        ("el", "Greek"),
        ("sq", "Albanian"),
        ("es", "Spanish"),
        ("fr", "French"),
        ("vi", "Vietnamese"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    language = models.CharField(
        max_length=5, choices=LANGUAGE_CHOICES, default="en"
    )
    # User-supplied Gemini API key (stored plaintext – dev only)
    gemini_api_key = models.CharField(max_length=200, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Profile<{self.user.username}>"
