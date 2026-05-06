from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from . import services
from .models import ChatMessage, ChatSession
from .serializers import ChatMessageSerializer, ChatSessionSerializer


class ChatSessionViewSet(viewsets.ModelViewSet):
    """A chat session is bound to a single contract."""

    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Return existing session for this user+contract, or create a new one."""
        contract_id = request.data.get("contract")
        if not contract_id:
            return Response({"detail": "contract is required"}, status=400)
        session, _ = ChatSession.objects.get_or_create(
            user=request.user,
            contract_id=contract_id,
        )
        return Response(ChatSessionSerializer(session).data, status=200)

    @action(detail=True, methods=["post"], url_path="ask")
    def ask(self, request, pk=None):
        session = self.get_object()
        question = (request.data.get("question") or "").strip()
        language = request.data.get("language", "en")
        if not question:
            return Response({"detail": "question is required"}, status=400)

        ChatMessage.objects.create(session=session, role="user", content=question)
        reply = services.answer(session, question, language=language)
        msg = ChatMessage.objects.create(
            session=session, role="assistant", content=reply
        )
        return Response(ChatMessageSerializer(msg).data)
