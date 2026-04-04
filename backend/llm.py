"""LiteLLM integration for AI chat and NDA field extraction."""
from litellm import completion

from models import ChatMessage, ChatResponse

SYSTEM_PROMPT = """You are a helpful legal assistant for Prelegal, helping users create a Mutual Non-Disclosure Agreement (Mutual NDA).

Your job is to have a friendly, conversational chat to collect the information needed to fill in the NDA document. Ask one or two questions at a time — don't overwhelm the user.

The NDA has these fields you need to collect:
- purpose: How confidential information may be used (e.g. "Evaluating whether to enter into a business relationship")
- effectiveDate: The date the NDA takes effect (YYYY-MM-DD format)
- mndaTermType: Duration of the NDA — either "fixed" (expires after N years) or "perpetual" (continues until terminated)
- mndaTermYears: Number of years if mndaTermType is "fixed" (integer, 1-99)
- confidentialityTermType: How long info stays protected — "fixed" (N years) or "perpetual" (forever)
- confidentialityTermYears: Number of years if confidentialityTermType is "fixed" (integer, 1-99)
- governingLaw: Which state's laws govern this agreement (e.g. "Delaware")
- jurisdiction: Where disputes are resolved (e.g. "courts located in New Castle, DE")
- modifications: Any custom modifications to the standard terms (optional, can be empty)
- party1Name, party1Title, party1Company, party1NoticeAddress, party1Date: First party's details
- party2Name, party2Title, party2Company, party2NoticeAddress, party2Date: Second party's details

Guidelines:
- Start by warmly greeting the user and asking what the NDA is for (purpose) and who the two parties are.
- As you learn information, extract and return it in field_updates.
- Only include fields in field_updates that you actually learned in this turn — leave others as null.
- For dates, use YYYY-MM-DD format.
- For mndaTermType and confidentialityTermType, only use "fixed" or "perpetual".
- When you have all the information, confirm with the user and let them know the document preview on the right is ready to download.
- Be concise and professional but friendly.
"""


def chat(messages: list[ChatMessage]) -> ChatResponse:
    """Send chat messages to the LLM and return a response with any extracted NDA fields."""
    llm_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    llm_messages += [{"role": m.role, "content": m.content} for m in messages]

    call_kwargs = {
        "model": "openrouter/free",
        "messages": llm_messages,
        "extra_body": {"provider": {"order": ["cerebras"]}},
        "response_format": ChatResponse,
    }

    response = completion(**call_kwargs)
    result = response.choices[0].message.content or "{}"
    return ChatResponse.model_validate_json(result)
