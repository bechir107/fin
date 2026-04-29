import os
import traceback

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except Exception:
    OPENAI_AVAILABLE = False


class AIService:
    """Synchronous AI service wrapper tailored for a nutritionist assistant.

    - Uses the OpenAI Python SDK `OpenAI` when available (recommended).
    - Falls back to raising a clear error if SDK is missing; you can change to use requests if needed.
    """

    SYSTEM_PROMPT = (
        "You are NutriCare, an expert clinical nutritionist and registered dietitian. "
        "Answer user questions about nutrition, meal planning, dietary restrictions, allergies, "
        "weight management, and healthy lifestyles. Provide clear, evidence-based, practical "
        "and empathetic guidance. Ask clarifying questions when needed. Never provide prescriptive "
        "medical treatment; recommend consulting a healthcare professional when appropriate. "
        "Keep answers concise and actionable.\n\n"
        "IMPORTANT: You MUST respond in JSON format with EXACTLY the following structure:\n"
        "{\n"
        "  \"response\": \"Your main answer to the patient's message\",\n"
        "  \"suggestions\": [\"Question 1?\", \"Question 2?\", \"Question 3?\"]\n"
        "}\n"
        "The suggestions should be 2 to 3 follow-up questions the patient could ask you based on your response."
    )

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.model = model or os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
        self.client = None
        if OPENAI_AVAILABLE and self.api_key:
            try:
                self.client = OpenAI(api_key=self.api_key)
            except Exception:
                self.client = None

    def is_configured(self) -> bool:
        return bool(self.client)

    def get_answer(self, user_id: str, user_message: str, conversation_history: list[dict] | None = None) -> str:
        """Return assistant reply string. conversation_history is list of {role, content} dicts."""
        if not self.client:
            raise RuntimeError('OpenAI client not configured (missing package or API key)')

        messages = [{"role": "system", "content": self.SYSTEM_PROMPT}]
        if conversation_history:
            # ensure we pass only role/content pairs and keep them small
            trimmed = conversation_history[-4:] if len(conversation_history) > 4 else conversation_history
            for m in trimmed:
                messages.append({"role": m.get('role', 'user'), "content": m.get('content', '')})

        messages.append({"role": "user", "content": user_message})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=700,
                response_format={"type": "json_object"}
            )
            assistant_msg = response.choices[0].message.content
            return assistant_msg.strip()

        except Exception as e:
            # rethrow with context
            tb = traceback.format_exc()
            raise RuntimeError(f'OpenAI request failed: {e}\n{tb}')


# module-level instance for convenience
_ai_service = AIService()


def get_nutrition_reply(user_id: str, user_message: str, conversation_history: list[dict] | None = None) -> str:
    if not _ai_service.is_configured():
        raise RuntimeError('AI service not configured: OPENAI_API_KEY missing or OpenAI SDK unavailable')
    return _ai_service.get_answer(user_id, user_message, conversation_history)
