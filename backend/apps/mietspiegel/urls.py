from rest_framework.routers import DefaultRouter

from .views import MietspiegelViewSet

router = DefaultRouter()
router.register(r"mietspiegel", MietspiegelViewSet, basename="mietspiegel")

urlpatterns = router.urls
