from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import Profile
from apps.chatbot.models import ChatMessage, ChatSession
from apps.contracts.models import Contract

User = get_user_model()


class ChatSessionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="chatuser", password="securepass123"
        )
        Profile.objects.get_or_create(user=self.user)
        self.client.force_authenticate(user=self.user)
        self.contract = Contract.objects.create(
            user=self.user,
            original_filename="lease.pdf",
            extracted_text="Some contract text.",
        )

    def test_create_session(self):
        """POSTing to /chat/ with a valid contract creates or returns a session."""
        res = self.client.post("/api/v1/chat/", {"contract": self.contract.id})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("id", res.data)

    def test_create_session_same_contract_returns_same_session(self):
        """Creating a session for the same contract twice returns the same session."""
        res1 = self.client.post("/api/v1/chat/", {"contract": self.contract.id})
        res2 = self.client.post("/api/v1/chat/", {"contract": self.contract.id})
        self.assertEqual(res1.data["id"], res2.data["id"])

    def test_create_session_without_contract_fails(self):
        """POSTing without a contract ID returns 400."""
        res = self.client.post("/api/v1/chat/", {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_create_session_for_other_users_contract(self):
        """Users cannot start a chat session for another user's contract."""
        other = User.objects.create_user(username="other", password="securepass123")
        other_contract = Contract.objects.create(
            user=other, original_filename="other.pdf"
        )
        res = self.client.post("/api/v1/chat/", {"contract": other_contract.id})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_chat_requires_auth(self):
        """Unauthenticated chat request returns 401."""
        self.client.force_authenticate(user=None)
        res = self.client.post("/api/v1/chat/", {"contract": self.contract.id})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class ChatAskTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="askuser", password="securepass123"
        )
        Profile.objects.get_or_create(user=self.user)
        self.client.force_authenticate(user=self.user)
        self.contract = Contract.objects.create(
            user=self.user,
            original_filename="lease.pdf",
            extracted_text="",  # no extracted text
        )
        res = self.client.post("/api/v1/chat/", {"contract": self.contract.id})
        self.session_id = res.data["id"]

    def test_ask_without_question_fails(self):
        """Asking with an empty question returns 400."""
        res = self.client.post(f"/api/v1/chat/{self.session_id}/ask/", {"question": ""})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_ask_unscanned_contract_returns_assistant_message(self):
        """Asking about an unscanned contract returns a prompt-to-scan message."""
        res = self.client.post(f"/api/v1/chat/{self.session_id}/ask/", {
            "question": "What is my notice period?",
            "language": "en",
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["role"], "assistant")
        self.assertIn("scan", res.data["content"].lower())

    def test_ask_saves_user_message(self):
        """Asking a question saves the user message to the database."""
        self.contract.extracted_text = "Some text"
        self.contract.save()
        # Will fail at Gemini call without API key but user message should be saved
        self.client.post(f"/api/v1/chat/{self.session_id}/ask/", {
            "question": "What is my deposit?",
            "language": "en",
        })
        user_msgs = ChatMessage.objects.filter(
            session_id=self.session_id, role="user"
        )
        self.assertEqual(user_msgs.count(), 1)
        self.assertEqual(user_msgs.first().content, "What is my deposit?")
