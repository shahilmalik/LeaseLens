from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from . import services
from .models import ChatMessage, ChatSession
from .serializers import ChatMessageSerializer, ChatSessionSerializer
from apps.contracts.models import Contract


class ChatSessionViewSet(viewsets.ModelViewSet):
    """A chat session is bound to a single contract."""

    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Return existing session for this user+contract, or create one. Contract must belong to user."""
        contract_id = request.data.get("contract")
        if not contract_id:
            return Response({"detail": "contract is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure contract belongs to the requesting user
        try:
            contract = Contract.objects.get(id=contract_id, user=request.user)
        except Contract.DoesNotExist:
            return Response({"detail": "Contract not found."}, status=status.HTTP_404_NOT_FOUND)

        session, _ = ChatSession.objects.get_or_create(
            user=request.user,
            contract=contract,
        )
        return Response(ChatSessionSerializer(session).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="ask")
    def ask(self, request, pk=None):
        session = self.get_object()
        question = (request.data.get("question") or "").strip()
        language = request.data.get("language", "en")
        if not question:
            return Response({"detail": "question is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Guard: contract must have extracted text
        if not session.contract.extracted_text:
            msg = (
                "Dieser Vertrag wurde noch nicht analysiert. Bitte zuerst scannen."
                if language == "de"
                else "This contract has not been scanned yet. Please scan it first."
            )
            reply_msg = ChatMessage.objects.create(session=session, role="assistant", content=msg)
            return Response(ChatMessageSerializer(reply_msg).data)

        ChatMessage.objects.create(session=session, role="user", content=question)
        try:
            reply = services.answer(session, question, language=language)
        except Exception as exc:
            reply = f"⚠️ AI error: {exc}"
        msg = ChatMessage.objects.create(session=session, role="assistant", content=reply)
        return Response(ChatMessageSerializer(msg).data)
