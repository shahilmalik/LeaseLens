from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from . import services
from .models import MietspiegelEntry
from .serializers import MietpreisbremseCheckSerializer, MietspiegelEntrySerializer


class MietspiegelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MietspiegelEntry.objects.all()
    serializer_class = MietspiegelEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["post"], url_path="check")
    def check(self, request):
        serializer = MietpreisbremseCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = services.check_mietpreisbremse(**serializer.validated_data)
        return Response(result)
