from rest_framework.routers import DefaultRouter

from .views import ChatSessionViewSet

router = DefaultRouter()
router.register(r"chat", ChatSessionViewSet, basename="chat")

urlpatterns = router.urls
