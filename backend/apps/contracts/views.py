import os

from django.http import FileResponse, Http404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from . import services
from .models import Contract
from .serializers import ClauseSerializer, ContractSerializer


class ContractViewSet(viewsets.ModelViewSet):
    """CRUD + analysis actions for rental contracts."""

    serializer_class = ContractSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Contract.objects.filter(user=self.request.user).order_by("-uploaded_at")

    def perform_create(self, serializer):
        uploaded = self.request.FILES.get("file")
        contract = serializer.save(
            user=self.request.user,
            original_filename=uploaded.name if uploaded else "",
        )
        contract.extracted_text = services.extract_text(contract)
        contract.save(update_fields=["extracted_text"])

    @action(detail=True, methods=["post"], url_path="scan")
    def scan(self, request, pk=None):
        contract = self.get_object()
        clauses = services.scan_clauses(contract, user=request.user)
        if not clauses:
            return Response(
                {"detail": "No Gemini API key configured. Add one in Profile → Settings."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {"id": contract.id, "score": contract.score, "clauses": clauses, "count": len(clauses)},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"], url_path="clauses")
    def clauses(self, request, pk=None):
        contract = self.get_object()
        return Response(ClauseSerializer(contract.clauses.all(), many=True).data)

    @action(detail=True, methods=["get"], url_path="deadlines")
    def deadlines(self, request, pk=None):
        contract = self.get_object()
        items = services.get_deadlines(contract, user=request.user)
        return Response(items)

    @action(detail=True, methods=["get"], url_path="download-report")
    def download_report(self, request, pk=None):
        contract = self.get_object()
        if not contract.report_pdf or not contract.report_pdf.name:
            raise Http404("Report not yet generated. Please scan the contract first.")
        file_path = contract.report_pdf.path
        if not os.path.exists(file_path):
            raise Http404("Report file not found on server.")
        filename = f"LeaseLens_Report_{contract.id}.pdf"
        return FileResponse(
            open(file_path, "rb"),
            as_attachment=True,
            filename=filename,
            content_type="application/pdf",
        )
