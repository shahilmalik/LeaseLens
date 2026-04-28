from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AuthViewSet, ProfileViewSet

router = DefaultRouter()
router.register(r"auth", AuthViewSet, basename="auth")

urlpatterns = router.urls + [
    # /api/v1/profile/  GET + PATCH  (no pk — always the logged-in user)
    path("profile/", ProfileViewSet.as_view({"get": "me", "patch": "me"}), name="profile"),
]
