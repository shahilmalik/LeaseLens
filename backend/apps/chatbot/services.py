"""Chatbot orchestration powered by Gemini."""
from __future__ import annotations

import os

from .models import ChatSession

# ---- key helper (mirrors contracts/services) ----

def _get_gemini_key(user=None) -> str:
    if user is not None:
        try:
            key = user.profile.gemini_api_key
            if key and key.strip():
                return key.strip()
        except Exception:
            pass
    return os.environ.get("GEMINI_API_KEY", "")


def _gemini_client(api_key: str):
    from google import genai
    return genai.Client(api_key=api_key)


# ---- system prompt ----

SYSTEM_PROMPT = """You are LeaseLens, a friendly and knowledgeable AI assistant that
helps international students in Stuttgart understand their German rental contracts.

You ALWAYS:
- Base your answers on the contract text provided below (if available)
- Cite relevant German law sections or BGH rulings when applicable
- Keep answers clear, practical and jargon-free
- Offer a concrete next step the tenant can take
- Respond in {language} (English if "en", German if "de")

You NEVER give binding legal advice — always recommend a Mieterverein or lawyer
for formal disputes.

CONTRACT TEXT (may be empty if no contract is loaded):
{contract_text}

CONVERSATION HISTORY:
{history}
"""


def answer(session: ChatSession, question: str, language: str = "en") -> str:
    """Return a Gemini-generated answer grounded in the contract text."""
    api_key = _get_gemini_key(session.user)
    if not api_key:
        if language == "de":
            return "Kein Gemini-API-Schlüssel konfiguriert. Bitte wende dich an den Administrator."
        return "No Gemini API key configured. Please contact the administrator."

    contract_text = session.contract.extracted_text or "(no contract text available)"

    # Build history string from last 10 messages (to stay within context window)
    # Django ORM does not support negative indexing — use reverse order + slice then flip
    msgs = list(session.messages.order_by("-created_at")[:10])[::-1]
    history_lines = [f"{m.role.upper()}: {m.content}" for m in msgs]
    history = "\n".join(history_lines) if history_lines else "(start of conversation)"

    prompt = SYSTEM_PROMPT.format(
        language="German" if language == "de" else "English",
        contract_text=contract_text[:8000],
        history=history,
    ) + f"\n\nUSER: {question}\n\nASSISTANT:"

    client = _gemini_client(api_key)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )
    return response.text.strip()
